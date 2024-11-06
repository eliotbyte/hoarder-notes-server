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

  @Put(':id/setUserRole')
  async setUserRole(
    @Req() req,
    @Param('id') spaceId: number,
    @Body() body: { user_id: number; role_id: number },
  ) {
    const currentUserId = req.user.userId;
    return this.spacesService.setUserRole(
      currentUserId,
      body.user_id,
      Number(spaceId),
      body.role_id,
    );
  }

  @Delete(':id/removeUserRole')
  async removeUserRole(
    @Req() req,
    @Param('id') spaceId: number,
    @Body() body: { user_id: number },
  ) {
    const currentUserId = req.user.userId;
    return this.spacesService.removeUserRole(
      currentUserId,
      body.user_id,
      Number(spaceId),
    );
  }

  @Get()
  async getSpaces(@Req() req) {
    const userId = req.user.userId;
    return this.spacesService.getSpacesForUser(userId);
  }

  @Get(':id')
  async getSpace(@Req() req, @Param('id') spaceId: number) {
    const userId = req.user.userId;
    return this.spacesService.getSpaceById(userId, Number(spaceId));
  }

  @Get(':id/permissions')
  async getSpacePermissions(@Req() req, @Param('id') spaceId: number) {
    const userId = req.user.userId;
    return this.spacesService.getSpacePermissions(userId, Number(spaceId));
  }

  @Get(':id/roles')
  async getRolesInSpace(@Req() req, @Param('id') spaceId: number) {
    const userId = req.user.userId;
    return this.spacesService.getRolesInSpace(userId, Number(spaceId));
  }

  @Post(':id/roles')
  async createRole(
    @Req() req,
    @Param('id') spaceId: number,
    @Body() createRoleDto: any,
  ) {
    const userId = req.user.userId;
    return this.spacesService.createRole(
      userId,
      Number(spaceId),
      createRoleDto,
    );
  }

  @Put(':spaceId/roles/:roleId')
  async editRole(
    @Req() req,
    @Param('spaceId') spaceId: number,
    @Param('roleId') roleId: number,
    @Body() updateRoleDto: any,
  ) {
    const userId = req.user.userId;
    return this.spacesService.editRole(
      userId,
      Number(spaceId),
      Number(roleId),
      updateRoleDto,
    );
  }

  @Put(':spaceId/roles/:roleId/topics')
  async editRoleTopics(
    @Req() req,
    @Param('spaceId') spaceId: number,
    @Param('roleId') roleId: number,
    @Body() body: { topic_ids: number[] },
  ) {
    const userId = req.user.userId;
    return this.spacesService.editRoleTopics(
      userId,
      Number(spaceId),
      Number(roleId),
      body.topic_ids,
    );
  }
}
