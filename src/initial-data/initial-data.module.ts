import { Module } from '@nestjs/common';
import { InitialDataService } from './initial-data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from '../entities/user_role.entity';
import { SpacePermission } from '../entities/space_permission.entity';
import { TopicPermission } from '../entities/topic_permission.entity';
import { TopicAccessLevel } from '../entities/topic_access_level.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRole,
      SpacePermission,
      TopicPermission,
      TopicAccessLevel,
    ]),
  ],
  providers: [InitialDataService],
})
export class InitialDataModule {}
