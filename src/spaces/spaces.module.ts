import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Space } from '../entities/space.entity';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { UserRole } from '../entities/user_role.entity';
import { SpacePermission } from '../entities/space_permission.entity';
import { RolePermission } from '../entities/role_permission.entity';
import { User } from '../entities/user.entity';
import { Topic } from '../entities/topic.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SpacePermissionsLoaderService } from '../space-permissions-loader/space-permissions-loader.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Space,
      UserSpaceRole,
      UserRole,
      SpacePermission,
      RolePermission,
      User,
      Topic,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '3600s' },
      }),
    }),
  ],
  providers: [SpacesService, JwtStrategy, SpacePermissionsLoaderService],
  controllers: [SpacesController],
  exports: [SpacesService],
})
export class SpacesModule {}
