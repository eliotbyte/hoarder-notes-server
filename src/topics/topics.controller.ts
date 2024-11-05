import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TopicsService } from './topics.service';

@UseGuards(JwtAuthGuard)
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  async createTopic(
    @Req() req,
    @Body()
    createTopicDto: { name: string; space_id: number; access_level_id: number },
  ) {
    const userId = req.user.userId;
    return this.topicsService.createTopic(userId, createTopicDto);
  }

  @Put(':id')
  async editTopic(
    @Req() req,
    @Param('id') topicId: number,
    @Body() updateTopicDto: { name: string; access_level_id?: number },
  ) {
    const userId = req.user.userId;
    return this.topicsService.editTopic(userId, topicId, updateTopicDto);
  }

  @Delete(':id')
  async deleteTopic(@Req() req, @Param('id') topicId: number) {
    const userId = req.user.userId;
    return this.topicsService.deleteTopic(userId, topicId);
  }

  // Modified to handle query parameters
  @Get('space/:spaceId')
  async getTopicsBySpace(@Req() req, @Param('spaceId') spaceId: number) {
    const userId = req.user.userId;
    return this.topicsService.getTopicsBySpace(userId, Number(spaceId));
  }

  @Put(':id/permissions')
  async editUserTopicPermissions(
    @Req() req,
    @Param('id') topicId: number,
    @Body() body: { user_id: number; permissions: string[] },
  ) {
    const currentUserId = req.user.userId;
    return this.topicsService.editUserTopicPermissions(
      currentUserId,
      body.user_id,
      Number(topicId),
      body.permissions,
    );
  }
}
