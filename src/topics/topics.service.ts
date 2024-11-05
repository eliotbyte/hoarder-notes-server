import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { Space } from '../entities/space.entity';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { UserTopicPermission } from '../entities/user_topic_permission.entity';
import { TopicPermission } from '../entities/topic_permission.entity';
import { TopicAccessLevel } from '../entities/topic_access_level.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    @InjectRepository(Space)
    private readonly spacesRepository: Repository<Space>,
    @InjectRepository(UserSpaceRole)
    private readonly userSpaceRolesRepository: Repository<UserSpaceRole>,
    @InjectRepository(UserTopicPermission)
    private readonly userTopicPermissionsRepository: Repository<UserTopicPermission>,
    @InjectRepository(TopicPermission)
    private readonly topicPermissionsRepository: Repository<TopicPermission>,
    @InjectRepository(TopicAccessLevel)
    private readonly topicAccessLevelRepository: Repository<TopicAccessLevel>,
  ) {}

  async createTopic(userId: number, createTopicDto: any): Promise<Topic> {
    const { name, space_id, access_level_id } = createTopicDto;

    // Check if the user has permission to create topics in this space
    const userRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id },
    });

    if (!userRole || !['owner', 'moderator'].includes(userRole.role.name)) {
      throw new ForbiddenException(
        'You do not have permission to create topics in this space',
      );
    }

    // Check if the specified access level exists
    const accessLevel = await this.topicAccessLevelRepository.findOne({
      where: { id: access_level_id },
    });

    if (!accessLevel) {
      throw new NotFoundException('Access level not found');
    }

    // Create and save the topic
    const topic = this.topicsRepository.create({
      name,
      space_id,
      access_level_id,
      is_deleted: false,
    });

    return await this.topicsRepository.save(topic);
  }

  async editTopic(
    userId: number,
    topicId: number,
    updateTopicDto: any,
  ): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
      relations: ['space'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if the user has permission to edit the topic
    const userRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: topic.space_id },
      relations: ['role'],
    });

    if (!userRole || userRole.role.name !== 'owner') {
      throw new ForbiddenException(
        'You do not have permission to edit this topic',
      );
    }

    // Update topic properties
    topic.name = updateTopicDto.name ?? topic.name;
    topic.access_level_id =
      updateTopicDto.access_level_id ?? topic.access_level_id;

    return await this.topicsRepository.save(topic);
  }

  async deleteTopic(userId: number, topicId: number): Promise<Topic> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
      relations: ['space'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if the user has permission to delete the topic
    const userRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: topic.space_id },
      relations: ['role'],
    });

    if (!userRole || userRole.role.name !== 'owner') {
      throw new ForbiddenException(
        'You do not have permission to delete this topic',
      );
    }

    // Mark the topic as deleted
    topic.is_deleted = true;

    return await this.topicsRepository.save(topic);
  }

  async getTopicsBySpace(
    userId: number,
    spaceId: number,
    accessLevel?: string,
  ): Promise<Topic[]> {
    // Check if user is part of the space
    const userRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: spaceId },
    });

    if (!userRole) {
      throw new ForbiddenException('You are not a participant of this space');
    }

    // Build the query for topics based on access level
    const queryBuilder = this.topicsRepository
      .createQueryBuilder('topic')
      .where('topic.space_id = :spaceId', { spaceId })
      .andWhere('topic.is_deleted = false');

    if (accessLevel) {
      queryBuilder.andWhere('topic.access_level_id = :accessLevel', {
        accessLevel,
      });
    }

    return await queryBuilder.getMany();
  }

  async editUserTopicPermissions(
    currentUserId: number,
    targetUserId: number,
    topicId: number,
    permissions: string[],
  ): Promise<any> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
      relations: ['space'],
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if the current user has permission to edit topic permissions
    const currentUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: currentUserId, space_id: topic.space_id },
      relations: ['role'],
    });

    if (
      !currentUserRole ||
      !['owner', 'moderator'].includes(currentUserRole.role.name)
    ) {
      throw new ForbiddenException('You cannot edit topic permissions');
    }

    // Moderators cannot edit owner's permissions
    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: topic.space_id },
      relations: ['role'],
    });

    if (!targetUserRole) {
      throw new NotFoundException('User not found in this space');
    }

    if (
      targetUserRole.role.name === 'owner' &&
      currentUserRole.role.name !== 'owner'
    ) {
      throw new ForbiddenException('You cannot edit permissions of the owner');
    }

    // Update permissions
    await this.userTopicPermissionsRepository.delete({
      user_id: targetUserId,
      topic_id: topicId,
    });

    const allPermissions = await this.topicPermissionsRepository.find({
      where: { name: In(permissions) },
    });

    const newPermissions = allPermissions.map((permission) =>
      this.userTopicPermissionsRepository.create({
        user_id: targetUserId,
        topic_id: topicId,
        permission_id: permission.id,
      }),
    );

    await this.userTopicPermissionsRepository.save(newPermissions);

    return { message: 'Topic permissions updated successfully' };
  }
}
