import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from '../entities/topic.entity';
import { Space } from '../entities/space.entity';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { UserTopicPermission } from '../entities/user_topic_permission.entity';
import { TopicPermission } from '../entities/topic_permission.entity';
import { TopicAccessLevel } from '../entities/topic_access_level.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Topic,
      Space,
      UserSpaceRole,
      UserTopicPermission,
      TopicPermission,
      TopicAccessLevel,
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
  providers: [TopicsService, JwtStrategy],
  controllers: [TopicsController],
})
export class TopicsModule {}
