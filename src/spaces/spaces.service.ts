import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Space } from '../entities/space.entity';
import { Repository } from 'typeorm';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { UserRole } from '../entities/user_role.entity';
import { SpacePermission } from '../entities/space_permission.entity';
import { RolePermission } from '../entities/role_permission.entity';
import { User } from '../entities/user.entity';
import { SPACE_PERMISSIONS_IDS } from '../common/constants/space_permissions.constants';

@Injectable()
export class SpacesService {
  constructor(
    @InjectRepository(Space)
    private readonly spacesRepository: Repository<Space>,
    @InjectRepository(UserSpaceRole)
    private readonly userSpaceRolesRepository: Repository<UserSpaceRole>,
    @InjectRepository(UserRole)
    private readonly userRolesRepository: Repository<UserRole>,
    @InjectRepository(SpacePermission)
    private readonly spacePermissionsRepository: Repository<SpacePermission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async hasPermission(
    userId: number,
    spaceId: number,
    permissionName: string,
  ): Promise<boolean> {
    const userSpaceRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: spaceId },
      relations: ['role'],
    });

    if (!userSpaceRole) {
      return false;
    }

    const permissionId = SPACE_PERMISSIONS_IDS[permissionName];

    if (!permissionId) {
      return false;
    }

    const rolePermission = await this.rolePermissionsRepository.findOne({
      where: {
        role_id: userSpaceRole.role_id,
        permission_id: permissionId,
      },
    });

    return !!rolePermission;
  }

  async getUserSpaceRole(
    userId: number,
    spaceId: number,
  ): Promise<UserRole | null> {
    const userSpaceRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: spaceId },
      relations: ['role'],
    });

    if (userSpaceRole) {
      return userSpaceRole.role;
    } else {
      return null;
    }
  }

  async createSpace(userId: number, createSpaceDto: any): Promise<any> {
    const { name } = createSpaceDto;

    // Create the space
    const space = this.spacesRepository.create({
      name,
      is_deleted: false,
    });
    const savedSpace = await this.spacesRepository.save(space);

    // Define default roles and their permissions
    const defaultRoles = [
      {
        name: 'owner',
        is_custom: false,
        is_default: true,
        permissions: Object.keys(SPACE_PERMISSIONS_IDS), // All permissions
      },
      {
        name: 'moderator',
        is_custom: false,
        is_default: true,
        permissions: [
          'CHANGE_USER_ROLES',
          'CREATE_NOTES',
          'EDIT_NOTES',
          'DELETE_NOTES',
          'READ_NOTES',
          'CREATE_TOPICS',
          'EDIT_TOPICS',
          'DELETE_TOPICS',
        ],
      },
      {
        name: 'member',
        is_custom: false,
        is_default: true,
        permissions: [
          'CREATE_NOTES',
          'EDIT_NOTES',
          'DELETE_NOTES',
          'READ_NOTES',
        ],
      },
    ];

    // Create roles and assign permissions
    for (const roleData of defaultRoles) {
      const role = this.userRolesRepository.create({
        name: roleData.name,
        is_custom: roleData.is_custom,
        is_default: roleData.is_default,
        space_id: savedSpace.id,
      });
      const savedRole = await this.userRolesRepository.save(role);

      // Assign permissions to role
      const rolePermissions = roleData.permissions.map((permName) => {
        const permissionId = SPACE_PERMISSIONS_IDS[permName];
        return this.rolePermissionsRepository.create({
          role_id: savedRole.id,
          permission_id: permissionId,
        });
      });

      await this.rolePermissionsRepository.save(rolePermissions);

      // If role is 'owner', assign it to the user
      if (roleData.name === 'owner') {
        const userSpaceRole = this.userSpaceRolesRepository.create({
          user_id: userId,
          space_id: savedSpace.id,
          role_id: savedRole.id,
        });
        await this.userSpaceRolesRepository.save(userSpaceRole);
      }
    }

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

    // Check if user has 'EDIT_SPACES' permission in the space
    const hasPermission = await this.hasPermission(
      userId,
      spaceId,
      'EDIT_SPACES',
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

    // Check if user has 'DELETE_SPACES' permission in the space
    const hasPermission = await this.hasPermission(
      userId,
      spaceId,
      'DELETE_SPACES',
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

    // Check if user has 'EDIT_SPACES' permission in the space
    const hasPermission = await this.hasPermission(
      userId,
      spaceId,
      'EDIT_SPACES',
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
    const result = {};

    for (const participant of participants) {
      const roleName = participant.role.name;
      if (!result[roleName]) {
        result[roleName] = [];
      }
      result[roleName].push({
        id: participant.user.id,
        name: participant.user.name,
      });
    }

    return result;
  }

  async editUserRole(
    currentUserId: number,
    targetUserId: number,
    spaceId: number,
    roleName: string,
  ): Promise<any> {
    // Check if current user has 'CHANGE_USER_ROLES' permission
    const hasPermission = await this.hasPermission(
      currentUserId,
      spaceId,
      'CHANGE_USER_ROLES',
    );

    if (!hasPermission) {
      throw new ForbiddenException('You cannot edit user roles in this space');
    }

    // Get target user's role
    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (!targetUserRole) {
      throw new NotFoundException('User not found in this space');
    }

    // Get the new role
    const newRole = await this.userRolesRepository.findOne({
      where: { name: roleName, space_id: spaceId },
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
    // Check if current user has 'CHANGE_USER_ROLES' permission
    const hasPermission = await this.hasPermission(
      currentUserId,
      spaceId,
      'CHANGE_USER_ROLES',
    );

    if (!hasPermission) {
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

    // Assign default role (member)
    const memberRole = await this.userRolesRepository.findOne({
      where: { name: 'member', space_id: spaceId },
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
    // Check if current user has 'CHANGE_USER_ROLES' permission
    const hasPermission = await this.hasPermission(
      currentUserId,
      spaceId,
      'CHANGE_USER_ROLES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You cannot remove participants from this space',
      );
    }

    // Get target user's role
    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
    });

    if (!targetUserRole) {
      throw new NotFoundException('User not found in this space');
    }

    // Remove user from space roles
    await this.userSpaceRolesRepository.delete({ id: targetUserRole.id });

    return { message: 'Participant removed successfully' };
  }

  async getSpacesForUser(userId: number): Promise<any[]> {
    // Fetch the spaces where the user has a role
    const userSpaces = await this.userSpaceRolesRepository.find({
      where: { user_id: userId },
      relations: ['space', 'role'],
    });

    const result = [];

    for (const userSpace of userSpaces) {
      // Get permissions assigned to the role
      const rolePermissions = await this.rolePermissionsRepository.find({
        where: { role_id: userSpace.role_id },
        relations: ['permission'],
      });

      const permissionNames = rolePermissions.map((rp) =>
        rp.permission.name.toUpperCase(),
      );

      result.push({
        id: userSpace.space.id,
        name: userSpace.space.name,
        role: userSpace.role.name,
        permissions: permissionNames,
      });
    }

    return result;
  }

  async setUserRole(
    currentUserId: number,
    targetUserId: number,
    spaceId: number,
    roleId: number,
  ): Promise<any> {
    // Check if current user has 'CHANGE_USER_ROLES' permission
    const hasPermission = await this.hasPermission(
      currentUserId,
      spaceId,
      'CHANGE_USER_ROLES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You cannot change user roles in this space',
      );
    }

    // Fetch the role to assign
    const roleToAssign = await this.userRolesRepository.findOne({
      where: { id: roleId, space_id: spaceId },
    });

    if (!roleToAssign) {
      throw new NotFoundException('Role not found');
    }

    // Restrictions: No one can assign the owner role
    if (roleToAssign.name === 'owner') {
      throw new ForbiddenException('You cannot assign the owner role');
    }

    // Only owner can assign moderator role
    if (roleToAssign.name === 'moderator') {
      // Check if current user is owner
      const currentUserRole = await this.getUserSpaceRole(
        currentUserId,
        spaceId,
      );

      if (!currentUserRole || currentUserRole.name !== 'owner') {
        throw new ForbiddenException(
          'Only owner can assign the moderator role',
        );
      }
    }

    // Check if target user exists
    const targetUser = await this.usersRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Assign or update the user's role in the space
    let userSpaceRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
    });

    if (!userSpaceRole) {
      // Create new role assignment
      userSpaceRole = this.userSpaceRolesRepository.create({
        user_id: targetUserId,
        space_id: spaceId,
        role_id: roleToAssign.id,
      });
      await this.userSpaceRolesRepository.save(userSpaceRole);
    } else {
      // Update existing role assignment
      userSpaceRole.role_id = roleToAssign.id;
      await this.userSpaceRolesRepository.save(userSpaceRole);
    }

    return { message: 'User role updated successfully' };
  }
}
