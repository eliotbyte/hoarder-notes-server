import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SpacePermission } from '../entities/space_permission.entity';
import { Repository } from 'typeorm';
import { SPACE_PERMISSIONS_IDS } from '../common/constants/space_permissions.constants';

@Injectable()
export class SpacePermissionsLoaderService implements OnModuleInit {
  constructor(
    @InjectRepository(SpacePermission)
    private readonly spacePermissionRepository: Repository<SpacePermission>,
  ) {}

  async onModuleInit() {
    await this.loadSpacePermissions();
  }

  private async loadSpacePermissions() {
    const permissionNames = Object.keys(SPACE_PERMISSIONS_IDS);

    for (const permissionName of permissionNames) {
      // Convert to lower case for searching
      const lowerCaseName = permissionName.toLowerCase();

      // Check if permission exists
      let permission = await this.spacePermissionRepository.findOne({
        where: { name: lowerCaseName },
      });

      if (!permission) {
        // Insert new permission
        permission = this.spacePermissionRepository.create({
          name: lowerCaseName,
        });
        await this.spacePermissionRepository.save(permission);
      }

      // Set the ID into the constant
      SPACE_PERMISSIONS_IDS[permissionName] = permission.id;
    }
  }
}
