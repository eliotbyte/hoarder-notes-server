import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { SpacesService } from '../spaces/spaces.service';
import { TopicUserRole } from '../entities/topic_user_role.entity';
import { UserRole } from '../entities/user_role.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
    @InjectRepository(TopicUserRole)
    private readonly topicUserRolesRepository: Repository<TopicUserRole>,
    private readonly spacesService: SpacesService,
  ) {}

  async createTopic(userId: number, createTopicDto: any): Promise<any> {
    const { name, spaceId } = createTopicDto;

    // Check if the user has permission to create topics in this space
    const hasPermission = await this.spacesService.hasPermission(
      userId,
      spaceId,
      'CREATE_TOPICS',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create topics in this space',
      );
    }

    // Create and save the topic
    const topic = this.topicsRepository.create({
      name,
      space_id: spaceId,
      is_deleted: false,
    });

    const savedTopic = await this.topicsRepository.save(topic);

    // Get the 'owner' role in the space
    const ownerRole = await this.userRolesRepository.findOne({
      where: { name: 'owner', space_id: spaceId },
    });

    if (ownerRole) {
      // Create the TopicUserRole association
      const topicUserRole = this.topicUserRolesRepository.create({
        topic_id: savedTopic.id,
        role_id: ownerRole.id,
      });

      await this.topicUserRolesRepository.save(topicUserRole);
    }

    // Map the response to change field names
    const { space_id, is_deleted, created_at, modified_at, ...rest } =
      savedTopic;
    return {
      ...rest,
      spaceId: space_id,
      createdAt: created_at,
      modifiedAt: modified_at,
    };
  }

  async editTopic(
    userId: number,
    topicId: number,
    updateTopicDto: any,
  ): Promise<any> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if the user has permission to edit topics in this space
    const hasPermission = await this.spacesService.hasPermission(
      userId,
      topic.space_id,
      'EDIT_TOPICS',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to edit this topic',
      );
    }

    // Update topic properties
    topic.name = updateTopicDto.name ?? topic.name;

    const updatedTopic = await this.topicsRepository.save(topic);

    // Map the response fields
    const { space_id, is_deleted, created_at, modified_at, ...rest } =
      updatedTopic;
    return {
      ...rest,
      spaceId: space_id,
      createdAt: created_at,
      modifiedAt: modified_at,
    };
  }

  async deleteTopic(userId: number, topicId: number): Promise<any> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if the user has permission to delete topics in this space
    const hasPermission = await this.spacesService.hasPermission(
      userId,
      topic.space_id,
      'DELETE_TOPICS',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this topic',
      );
    }

    // Mark the topic as deleted
    topic.is_deleted = true;

    const deletedTopic = await this.topicsRepository.save(topic);

    // Map the response fields
    const { space_id, is_deleted, created_at, modified_at, ...rest } =
      deletedTopic;
    return {
      ...rest,
      spaceId: space_id,
      createdAt: created_at,
      modifiedAt: modified_at,
    };
  }
}
