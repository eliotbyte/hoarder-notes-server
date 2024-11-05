import { Module } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { SpacesController } from './spaces.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Space } from '../entities/space.entity';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { UserSpacePermission } from '../entities/user_space_permission.entity';
import { UserRole } from '../entities/user_role.entity';
import { SpacePermission } from '../entities/space_permission.entity';
import { User } from '../entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Space,
      UserSpaceRole,
      UserSpacePermission,
      UserRole,
      SpacePermission,
      User,
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
  providers: [SpacesService, JwtStrategy],
  controllers: [SpacesController],
})
export class SpacesModule {}
