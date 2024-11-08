import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Space } from '../entities/space.entity';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { UserRole } from '../entities/user_role.entity';
import { SpacePermission } from '../entities/space_permission.entity';
import { RolePermission } from '../entities/role_permission.entity';
import { User } from '../entities/user.entity';
import { Topic } from '../entities/topic.entity';
import { TopicUserRole } from '../entities/topic_user_role.entity';
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

    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,

    @InjectRepository(TopicUserRole)
    private readonly topicUserRolesRepository: Repository<TopicUserRole>,
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

  async getUserRolesInSpace(
    userId: number,
    spaceId: number,
  ): Promise<UserRole[]> {
    const userSpaceRoles = await this.userSpaceRolesRepository.find({
      where: { user_id: userId, space_id: spaceId },
      relations: ['role'],
    });

    return userSpaceRoles.map((usr) => usr.role);
  }

  async getSpacesForUser(userId: number): Promise<any[]> {
    // Fetch the spaces where the user has a role
    const userSpaces = await this.userSpaceRolesRepository.find({
      where: { user_id: userId },
      relations: ['space', 'role'],
    });

    const result = [];

    for (const userSpace of userSpaces) {
      const space = userSpace.space;

      if (space.is_deleted) {
        continue; // Skip deleted spaces
      }

      // Get permissions assigned to the role
      const rolePermissions = await this.rolePermissionsRepository.find({
        where: { role_id: userSpace.role_id },
        relations: ['permission'],
      });

      const permissionNames = rolePermissions.map((rp) =>
        rp.permission.name.toLowerCase(),
      );

      // Fetch topics associated with the user's roles in this space
      const userRoles = await this.getUserRolesInSpace(userId, space.id);
      const roleIds = userRoles.map((role) => role.id);

      const topicUserRoles = await this.topicUserRolesRepository.find({
        where: { role_id: In(roleIds) },
        relations: ['topic'],
      });

      const topics = topicUserRoles
        .filter((tur) => !tur.topic.is_deleted)
        .map((tur) => ({
          id: tur.topic.id,
          name: tur.topic.name,
        }));

      result.push({
        id: space.id,
        name: space.name,
        roles: userRoles.map((role) => role.name),
        permissions: permissionNames,
        topics: topics,
      });
    }

    return result;
  }

  async getSpaceById(userId: number, spaceId: number): Promise<any> {
    // Check if user is part of the space
    const userRoles = await this.getUserRolesInSpace(userId, spaceId);

    if (userRoles.length === 0) {
      throw new ForbiddenException('You are not a participant of this space');
    }

    const space = await this.spacesRepository.findOne({
      where: { id: spaceId, is_deleted: false },
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    // Get permissions assigned to the user's roles
    const roleIds = userRoles.map((role) => role.id);

    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { role_id: In(roleIds) },
      relations: ['permission'],
    });

    const permissionNames = rolePermissions.map((rp) =>
      rp.permission.name.toLowerCase(),
    );

    // Fetch topics associated with the user's roles in this space
    const topicUserRoles = await this.topicUserRolesRepository.find({
      where: { role_id: In(roleIds) },
      relations: ['topic'],
    });

    const topics = topicUserRoles
      .filter((tur) => !tur.topic.is_deleted)
      .map((tur) => ({
        id: tur.topic.id,
        name: tur.topic.name,
      }));

    return {
      id: space.id,
      name: space.name,
      roles: userRoles.map((role) => role.name),
      permissions: permissionNames,
      topics: topics,
    };
  }

  async getSpacePermissions(userId: number, spaceId: number): Promise<any> {
    // Check if user is part of the space
    const userRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: spaceId },
      relations: ['role'],
    });

    if (!userRole) {
      throw new ForbiddenException('You are not a participant of this space');
    }

    // Get permissions assigned to the role
    const rolePermissions = await this.rolePermissionsRepository.find({
      where: { role_id: userRole.role_id },
      relations: ['permission'],
    });

    const permissionNames = rolePermissions.map((rp) =>
      rp.permission.name.toLowerCase(),
    );

    return {
      permissions: permissionNames,
    };
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

  async removeUserRole(
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
        'You cannot remove user roles in this space',
      );
    }

    // Fetch the target user's role in the space
    const targetUserRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: targetUserId, space_id: spaceId },
      relations: ['role'],
    });

    if (!targetUserRole) {
      throw new NotFoundException('User not found in this space');
    }

    // Restrictions: Cannot remove owner role
    if (targetUserRole.role.name === 'owner') {
      throw new ForbiddenException('You cannot remove the owner role');
    }

    // Only owner can remove moderator role
    if (targetUserRole.role.name === 'moderator') {
      // Check if current user is owner
      const currentUserRole = await this.getUserSpaceRole(
        currentUserId,
        spaceId,
      );

      if (!currentUserRole || currentUserRole.name !== 'owner') {
        throw new ForbiddenException(
          'Only owner can remove the moderator role',
        );
      }
    }

    // Remove user from space roles
    await this.userSpaceRolesRepository.delete({ id: targetUserRole.id });

    return { message: 'User role removed successfully' };
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
          'CREATE_ROLES',
          'CREATE_NOTES',
          'EDIT_NOTES',
          'DELETE_NOTES',
          'READ_NOTES',
          'CREATE_TOPICS',
          'EDIT_TOPICS',
          'DELETE_TOPics',
          // Add other permissions as needed
        ],
      },
      {
        name: 'member',
        is_custom: false,
        is_default: true,
        permissions: [
          'CREATE_NOTES',
          'EDIT_NOTES',
          'DELETE_NOTes',
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

    // Modify the response fields to exclude `is_deleted` and use camelCase
    const { is_deleted, created_at, modified_at, ...rest } = savedSpace;
    return {
      ...rest,
      createdAt: created_at,
      modifiedAt: modified_at,
    };
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
    const updatedSpace = await this.spacesRepository.save(space);

    // Modify the response fields to exclude `is_deleted` and use camelCase
    const { is_deleted, created_at, modified_at, ...rest } = updatedSpace;
    return {
      ...rest,
      createdAt: created_at,
      modifiedAt: modified_at,
    };
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
    const deletedSpace = await this.spacesRepository.save(space);

    // Modify the response fields to exclude `is_deleted` and use camelCase
    const { is_deleted: _, created_at, modified_at, ...rest } = deletedSpace;
    return {
      ...rest,
      createdAt: created_at,
      modifiedAt: modified_at,
    };
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
    const restoredSpace = await this.spacesRepository.save(space);

    // Modify the response fields to exclude `is_deleted` and use camelCase
    const { is_deleted: _, created_at, modified_at, ...rest } = restoredSpace;
    return {
      ...rest,
      createdAt: created_at,
      modifiedAt: modified_at,
    };
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

  async getRolesInSpace(userId: number, spaceId: number): Promise<any> {
    // Check if user is part of the space
    const userRole = await this.userSpaceRolesRepository.findOne({
      where: { user_id: userId, space_id: spaceId },
      relations: ['role'],
    });

    if (!userRole) {
      throw new ForbiddenException('You are not a participant of this space');
    }

    // Fetch all roles in the space
    const roles = await this.userRolesRepository.find({
      where: { space_id: spaceId, is_deleted: false },
      relations: ['topicUserRoles', 'topicUserRoles.topic'],
    });

    const result = roles.map((role) => {
      const topics = role.topicUserRoles.map((tur) => ({
        id: tur.topic.id,
        name: tur.topic.name,
      }));

      return {
        id: role.id,
        name: role.name,
        is_custom: role.is_custom,
        is_default: role.is_default,
        topics: topics,
      };
    });

    return result;
  }

  async createRole(
    userId: number,
    spaceId: number,
    createRoleDto: any,
  ): Promise<any> {
    // Check if user has 'CREATE_ROLES' permission
    const hasPermission = await this.hasPermission(
      userId,
      spaceId,
      'CREATE_ROLES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to create roles in this space',
      );
    }

    const { name, permissions } = createRoleDto;

    // Create new role
    const role = this.userRolesRepository.create({
      name,
      is_custom: true,
      is_default: false,
      space_id: spaceId,
      is_deleted: false,
    });

    const savedRole = await this.userRolesRepository.save(role);

    // Assign permissions to role
    const rolePermissions = permissions.map((permName) => {
      const permissionId = SPACE_PERMISSIONS_IDS[permName];
      if (!permissionId) {
        throw new NotFoundException(`Permission ${permName} not found`);
      }
      return this.rolePermissionsRepository.create({
        role_id: savedRole.id,
        permission_id: permissionId,
      });
    });

    await this.rolePermissionsRepository.save(rolePermissions);

    return savedRole;
  }

  async editRole(
    userId: number,
    spaceId: number,
    roleId: number,
    updateRoleDto: any,
  ): Promise<any> {
    // Check if user has 'EDIT_ROLES' permission
    const hasPermission = await this.hasPermission(
      userId,
      spaceId,
      'EDIT_ROLES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to edit roles in this space',
      );
    }

    // Fetch the role to edit
    const role = await this.userRolesRepository.findOne({
      where: { id: roleId, space_id: spaceId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (!role.is_custom) {
      throw new ForbiddenException('You can only edit custom roles');
    }

    // Update role properties
    role.name = updateRoleDto.name ?? role.name;

    await this.userRolesRepository.save(role);

    // Update role permissions
    if (updateRoleDto.permissions) {
      // Delete existing permissions
      await this.rolePermissionsRepository.delete({ role_id: role.id });

      // Assign new permissions
      const rolePermissions = updateRoleDto.permissions.map((permName) => {
        const permissionId = SPACE_PERMISSIONS_IDS[permName];
        if (!permissionId) {
          throw new NotFoundException(`Permission ${permName} not found`);
        }
        return this.rolePermissionsRepository.create({
          role_id: role.id,
          permission_id: permissionId,
        });
      });

      await this.rolePermissionsRepository.save(rolePermissions);
    }

    return role;
  }

  async editRoleTopics(
    userId: number,
    spaceId: number,
    roleId: number,
    topicIds: number[],
  ): Promise<any> {
    // Check if user has 'EDIT_ROLES' permission
    const hasPermission = await this.hasPermission(
      userId,
      spaceId,
      'EDIT_ROLES',
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to edit roles in this space',
      );
    }

    // Check if the role exists and belongs to the space
    const role = await this.userRolesRepository.findOne({
      where: { id: roleId, space_id: spaceId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if the user has this role
    const userRoles = await this.getUserRolesInSpace(userId, spaceId);
    const userRoleIds = userRoles.map((ur) => ur.id);

    if (!userRoleIds.includes(roleId)) {
      throw new ForbiddenException('You cannot edit topics for this role');
    }

    // Verify that all topicIds are in the space
    const topics = await this.topicsRepository.findByIds(topicIds);
    const invalidTopics = topics.filter((topic) => topic.space_id !== spaceId);
    if (invalidTopics.length > 0) {
      throw new ForbiddenException(
        'Some topics are not in the specified space',
      );
    }

    // Delete existing TopicUserRole associations for this role
    await this.topicUserRolesRepository.delete({ role_id: roleId });

    // Create new associations
    const topicUserRoles = topicIds.map((topicId) => {
      return this.topicUserRolesRepository.create({
        role_id: roleId,
        topic_id: topicId,
      });
    });

    await this.topicUserRolesRepository.save(topicUserRoles);

    // Return the role_id and full list of topic_ids linked to role_id
    const updatedTopicUserRoles = await this.topicUserRolesRepository.find({
      where: { role_id: roleId },
    });

    return {
      role_id: roleId,
      topic_ids: updatedTopicUserRoles.map((tur) => tur.topic_id),
    };
  }
}
