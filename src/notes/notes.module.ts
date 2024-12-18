import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from '../entities/note.entity';
import { NoteTag } from '../entities/note_tag.entity';
import { Tag } from '../entities/tag.entity';
import { Topic } from '../entities/topic.entity';
import { TopicUserRole } from '../entities/topic_user_role.entity';
import { UserSpaceRole } from '../entities/user_space_role.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SpacesModule } from '../spaces/spaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Note,
      NoteTag,
      Tag,
      Topic,
      TopicUserRole,
      UserSpaceRole,
    ]),
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
  providers: [NotesService, JwtStrategy],
  controllers: [NotesController],
})
export class NotesModule {}
