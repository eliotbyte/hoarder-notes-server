import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Space } from '../entities/space.entity';
import { Repository, In } from 'typeorm';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { UserSpacePermission } from '../entities/user_space_permission.entity';
import { UserRole } from '../entities/user_role.entity';
import { SpacePermission } from '../entities/space_permission.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(Space)
    private readonly spacesRepository: Repository<Space>,
    @InjectRepository(UserSpaceRole)
    private readonly userSpaceRolesRepository: Repository<UserSpaceRole>,
    @InjectRepository(UserSpacePermission)
    private readonly userSpacePermissionsRepository: Repository<UserSpacePermission>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
    @InjectRepository(SpacePermission)
    private readonly spacePermissionsRepository: Repository<SpacePermission>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createSpace(userId: number, createSpaceDto: any): Promise<any> {
    const { name } = createSpaceDto;

    // Create the space
    const space = this.spacesRepository.create({
      name,
      is_deleted: false,
    });
    const savedSpace = await this.spacesRepository.save(space);

    // Assign owner role to the user in the space
    const ownerRole = await this.userRolesRepository.findOne({
      where: { name: 'owner' },
    });
    if (!ownerRole) {
      throw new NotFoundException('Owner role not found');
    }

    const userSpaceRole = this.userSpaceRolesRepository.create({
      user_id: userId,
      space_id: savedSpace.id,
      role_id: ownerRole.id,
    });
    await this.userSpaceRolesRepository.save(userSpaceRole);

    // Assign all permissions to the user in the space
    const permissions = await this.spacePermissionsRepository.find();

    const userSpacePermissions = permissions.map((permission) =>
      this.userSpacePermissionsRepository.create({
        user_id: userId,
        space_id: savedSpace.id,
        permission_id: permission.id,
      }),
    );

    await this.userSpacePermissionsRepository.save(userSpacePermissions);

    return savedSpace;
  }

  async editSpace(
    userId: number,
    spaceId: number,
    updateSpaceDto: any,
  ): Promise<any> {
    const space = await this.spacesRepository.findOne({
      where: { id: spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check if user has 'edit' permission in the space
    const hasPermission = await this.hasSpacePermission(
      userId,
      spaceId,
      'edit',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to edit this space',
      );
    }

    space.name = updateSpaceDto.name ?? space.name;
    await this.spacesRepository.save(space);

    return space;
  }

  async deleteSpace(userId: number, spaceId: number): Promise<any> {
    const space = await this.spacesRepository.findOne({
      where: { id: spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check if user has 'delete' permission in the space
    const hasPermission = await this.hasSpacePermission(
      userId,
      spaceId,
      'delete',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to delete this space',
      );
    }

    space.is_deleted = true;
    await this.spacesRepository.save(space);

    return space;
  }

  async restoreSpace(userId: number, spaceId: number): Promise<any> {
    const space = await this.spacesRepository.findOne({
      where: { id: spaceId },
    });
    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Check if user has 'edit' permission in the space
    const hasPermission = await this.hasSpacePermission(
      userId,
      spaceId,
      'edit',
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to restore this space',
      );
    }

    space.is_deleted = false;
    await this.spacesRepository.save(space);

    return space;
  }

  async getSpaceParticipants(userId: number, spaceId: number): Promise<any> {
    // Check if user is part of the space
    const userRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: spaceId },
      relations: ['role'],
    });

    if (!userRole) {
      throw new ForbiddenException('You are not a participant of this space');
    }

    // Fetch all participants
    const participants = await this.userSpaceRolesRepository.find({
      where: { space_id: spaceId },
      relations: ['user', 'role'],
    });

    // Organize participants by role
    const result = {
      owner: [],
      moderator: [],
      member: [],
    };

    for (const participant of participants) {
      const roleName = participant.role.name;
      result[roleName].push({
        id: participant.user.id,
        name: participant.user.name,
      });
    }

    return result;
  }

  async getUserPermissions(
    currentUserId: number,
    targetUserId: number,
    spaceId: number,
  ): Promise<any> {
    // Check if current user can view permissions
    const currentUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: currentUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (!currentUserRole) {
      throw new ForbiddenException('You are not a participant of this space');
    }

    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (!targetUserRole) {
      throw new NotFoundException('User not found in this space');
    }

    if (
      currentUserId !== targetUserId &&
      !['owner', 'moderator'].includes(currentUserRole.role.name)
    ) {
      throw new ForbiddenException(
        'You cannot view permissions of other users',
      );
    }

    // Get permissions
    const permissions = await this.userSpacePermissionsRepository.find({
      where: { user_id: targetUserId, space_id: spaceId },
      relations: ['permission'],
    });

    return permissions.map((perm) => perm.permission.name);
  }

  async editUserPermissions(
    currentUserId: number,
    targetUserId: number,
    spaceId: number,
    permissions: string[],
  ): Promise<any> {
    // Only owner or moderator can edit permissions
    const currentUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: currentUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (
      !currentUserRole ||
      !['owner', 'moderator'].includes(currentUserRole.role.name)
    ) {
      throw new ForbiddenException('You cannot edit permissions in this space');
    }

    // Moderators cannot edit owner's permissions
    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (
      targetUserRole.role.name === 'owner' &&
      currentUserRole.role.name !== 'owner'
    ) {
      throw new ForbiddenException('You cannot edit permissions of the owner');
    }

    // Update permissions
    await this.userSpacePermissionsRepository.delete({
      user_id: targetUserId,
      space_id: spaceId,
    });

    const allPermissions = await this.spacePermissionsRepository.find({
      where: { name: In(permissions) },
    });

    const newPermissions = allPermissions.map((permission) =>
      this.userSpacePermissionsRepository.create({
        user_id: targetUserId,
        space_id: spaceId,
        permission_id: permission.id,
      }),
    );

    await this.userSpacePermissionsRepository.save(newPermissions);

    return { message: 'Permissions updated successfully' };
  }

  async editUserRole(
    currentUserId: number,
    targetUserId: number,
    spaceId: number,
    roleName: string,
  ): Promise<any> {
    // Only owner can edit roles
    const currentUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: currentUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (!currentUserRole || currentUserRole.role.name !== 'owner') {
      throw new ForbiddenException('Only the owner can edit user roles');
    }

    // Cannot change owner's role
    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (!targetUserRole) {
      throw new NotFoundException('User not found in this space');
    }

    if (targetUserRole.role.name === 'owner') {
      throw new ForbiddenException("Cannot change the owner's role");
    }

    const newRole = await this.userRolesRepository.findOne({
      where: { name: roleName },
    });
    if (!newRole) {
      throw new NotFoundException('Role not found');
    }

    targetUserRole.role_id = newRole.id;
    await this.userSpaceRolesRepository.save(targetUserRole);

    return { message: 'User role updated successfully' };
  }

  async addParticipant(
    currentUserId: number,
    targetUserId: number,
    spaceId: number,
  ): Promise<any> {
    // Only owner and moderator can add participants
    const currentUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: currentUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (
      !currentUserRole ||
      !['owner', 'moderator'].includes(currentUserRole.role.name)
    ) {
      throw new ForbiddenException('You cannot add participants to this space');
    }

    // Check if user exists
    const targetUser = await this.usersRepository.findOne({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a participant
    const existingRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
    });

    if (existingRole) {
      throw new ConflictException(
        'User is already a participant of this space',
      );
    }

    // Assign 'member' role
    const memberRole = await this.userRolesRepository.findOne({
      where: { name: 'member' },
    });
    if (!memberRole) {
      throw new NotFoundException('Member role not found');
    }

    const newUserSpaceRole = this.userSpaceRolesRepository.create({
      user_id: targetUserId,
      space_id: spaceId,
      role_id: memberRole.id,
    });

    await this.userSpaceRolesRepository.save(newUserSpaceRole);

    return { message: 'Participant added successfully' };
  }

  async removeParticipant(
    currentUserId: number,
    targetUserId: number,
    spaceId: number,
  ): Promise<any> {
    // Only owner and moderator can remove participants
    const currentUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: currentUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (
      !currentUserRole ||
      !['owner', 'moderator'].includes(currentUserRole.role.name)
    ) {
      throw new ForbiddenException(
        'You cannot remove participants from this space',
      );
    }

    // Get target user's role
    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (!targetUserRole) {
      throw new NotFoundException('User not found in this space');
    }

    if (currentUserRole.role.name === 'moderator') {
      if (targetUserRole.role.name !== 'member') {
        throw new ForbiddenException('Moderators can only remove members');
      }
    }

    if (currentUserRole.role.name === 'owner') {
      if (targetUserRole.role.name === 'owner') {
        throw new ForbiddenException('Owner cannot remove themselves');
      }
    }

    // Remove user from space roles and permissions
    await this.userSpaceRolesRepository.delete({ id: targetUserRole.id });
    await this.userSpacePermissionsRepository.delete({
      user_id: targetUserId,
      space_id: spaceId,
    });

    return { message: 'Participant removed successfully' };
  }

  private async hasSpacePermission(
    userId: number,
    spaceId: number,
    permissionName: string,
  ): Promise<boolean> {
    const permission = await this.spacePermissionsRepository.findOne({
      where: { name: permissionName },
    });
    if (!permission) {
      return false;
    }

    const userPermission = await this.userSpacePermissionsRepository.findOne({
      where: {
        user_id: userId,
        space_id: spaceId,
        permission_id: permission.id,
      },
    });

    return !!userPermission;
  }
}
