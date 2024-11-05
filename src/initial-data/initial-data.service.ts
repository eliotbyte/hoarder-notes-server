import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '../entities/user_role.entity';
import { SpacePermission } from '../entities/space_permission.entity';
import { TopicPermission } from '../entities/topic_permission.entity';
import { TopicAccessLevel } from '../entities/topic_access_level.entity';
import { Repository } from 'typeorm';

@Injectable()
export class InitialDataService implements OnModuleInit {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(SpacePermission)
    private readonly spacePermissionRepository: Repository<SpacePermission>,
    @InjectRepository(TopicPermission)
    private readonly topicPermissionRepository: Repository<TopicPermission>,
    @InjectRepository(TopicAccessLevel)
    private readonly topicAccessLevelRepository: Repository<TopicAccessLevel>,
  ) {}

  async onModuleInit() {
    await this.seedUserRoles();
    await this.seedSpacePermissions();
    await this.seedTopicPermissions();
    await this.seedTopicAccessLevels();
  }

  private async seedUserRoles() {
    const roles = ['owner', 'moderator', 'member'];
    for (const roleName of roles) {
      const roleExists = await this.userRoleRepository.findOne({
        where: { name: roleName },
      });
      if (!roleExists) {
        const role = this.userRoleRepository.create({ name: roleName });
        await this.userRoleRepository.save(role);
      }
    }
  }

  private async seedSpacePermissions() {
    const permissions = ['create', 'edit', 'create_private', 'delete'];
    for (const permissionName of permissions) {
      const permissionExists = await this.spacePermissionRepository.findOne({
        where: { name: permissionName },
      });
      if (!permissionExists) {
        const permission = this.spacePermissionRepository.create({
          name: permissionName,
        });
        await this.spacePermissionRepository.save(permission);
      }
    }
  }

  private async seedTopicPermissions() {
    const permissions = ['read', 'create', 'delete', 'edit'];
    for (const permissionName of permissions) {
      const permissionExists = await this.topicPermissionRepository.findOne({
        where: { name: permissionName },
      });
      if (!permissionExists) {
        const permission = this.topicPermissionRepository.create({
          name: permissionName,
        });
        await this.topicPermissionRepository.save(permission);
      }
    }
  }

  private async seedTopicAccessLevels() {
    const accessLevels = ['public', 'private'];
    for (const levelName of accessLevels) {
      const levelExists = await this.topicAccessLevelRepository.findOne({
        where: { name: levelName },
      });
      if (!levelExists) {
        const accessLevel = this.topicAccessLevelRepository.create({
          name: levelName,
        });
        await this.topicAccessLevelRepository.save(accessLevel);
      }
    }
  }
}
