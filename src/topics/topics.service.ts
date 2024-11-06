import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from '../entities/topic.entity';
import { SpacesService } from '../spaces/spaces.service';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    private readonly spacesService: SpacesService,
  ) {}

  async createTopic(userId: number, createTopicDto: any): Promise<Topic> {
    const { name, space_id } = createTopicDto;

    // Check if the user has permission to create topics in this space
    const hasPermission = await this.spacesService.hasPermission(
      userId,
      space_id,
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
      space_id,
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

    return await this.topicsRepository.save(topic);
  }

  async deleteTopic(userId: number, topicId: number): Promise<Topic> {
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

    return await this.topicsRepository.save(topic);
  }
}
