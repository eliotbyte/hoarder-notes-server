import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from '../entities/topic.entity';
import { TopicUserRole } from '../entities/topic_user_role.entity';
import { UserRole } from '../entities/user_role.entity';
import { SpacesModule } from '../spaces/spaces.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Topic, TopicUserRole, UserRole]),
    SpacesModule,
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
