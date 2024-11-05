import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post()
  async createSpace(@Req() req, @Body() createSpaceDto: any) {
    const userId = req.user.userId;
    return this.spacesService.createSpace(userId, createSpaceDto);
  }

  @Put(':id')
  async editSpace(
    @Req() req,
    @Param('id') spaceId: number,
    @Body() updateSpaceDto: any,
  ) {
    const userId = req.user.userId;
    return this.spacesService.editSpace(
      userId,
      Number(spaceId),
      updateSpaceDto,
    );
  }

  @Delete(':id')
  async deleteSpace(@Req() req, @Param('id') spaceId: number) {
    const userId = req.user.userId;
    return this.spacesService.deleteSpace(userId, Number(spaceId));
  }

  @Put(':id/restore')
  async restoreSpace(@Req() req, @Param('id') spaceId: number) {
    const userId = req.user.userId;
    return this.spacesService.restoreSpace(userId, Number(spaceId));
  }

  @Get(':id/participants')
  async getSpaceParticipants(@Req() req, @Param('id') spaceId: number) {
    const userId = req.user.userId;
    return this.spacesService.getSpaceParticipants(userId, Number(spaceId));
  }

  @Get(':id/permissions')
  async getUserPermissions(
    @Req() req,
    @Param('id') spaceId: number,
    @Body('user_id') userIdParam?: number,
  ) {
    const currentUserId = req.user.userId;
    const targetUserId = userIdParam || currentUserId;
    return this.spacesService.getUserPermissions(
      currentUserId,
      targetUserId,
      Number(spaceId),
    );
  }

  @Put(':id/permissions')
  async editUserPermissions(
    @Req() req,
    @Param('id') spaceId: number,
    @Body() body: { user_id: number; permissions: string[] },
  ) {
    const currentUserId = req.user.userId;
    return this.spacesService.editUserPermissions(
      currentUserId,
      body.user_id,
      Number(spaceId),
      body.permissions,
    );
  }

  @Put(':id/roles')
  async editUserRole(
    @Req() req,
    @Param('id') spaceId: number,
    @Body() body: { user_id: number; role: string },
  ) {
    const currentUserId = req.user.userId;
    return this.spacesService.editUserRole(
      currentUserId,
      body.user_id,
      Number(spaceId),
      body.role,
    );
  }

  @Post(':id/participants')
  async addParticipant(
    @Req() req,
    @Param('id') spaceId: number,
    @Body() body: { user_id: number },
  ) {
    const currentUserId = req.user.userId;
    return this.spacesService.addParticipant(
      currentUserId,
      body.user_id,
      Number(spaceId),
    );
  }
}
