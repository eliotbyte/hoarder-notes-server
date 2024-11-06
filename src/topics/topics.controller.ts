import {
  Controller,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
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
    @Body() createTopicDto: { name: string; space_id: number },
  ) {
    const userId = req.user.userId;
    return this.topicsService.createTopic(userId, createTopicDto);
  }

  @Put(':id')
  async editTopic(
    @Req() req,
    @Param('id') topicId: number,
    @Body() updateTopicDto: { name: string },
  ) {
    const userId = req.user.userId;
    return this.topicsService.editTopic(
      userId,
      Number(topicId),
      updateTopicDto,
    );
  }

  @Delete(':id')
  async deleteTopic(@Req() req, @Param('id') topicId: number) {
    const userId = req.user.userId;
    return this.topicsService.deleteTopic(userId, Number(topicId));
  }
}
