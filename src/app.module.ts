import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { User } from './entities/user.entity';
import { Note } from './entities/note.entity';
import { Tag } from './entities/tag.entity';
import { NoteTag } from './entities/note_tag.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule global
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'db', // Use 'db' as the host since it's the service name in docker-compose
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'hoarder_notes_db',
      entities: [User, Note, Tag, NoteTag],
      synchronize: true,
    }),
    AuthModule,
    NotesModule,
  ],
})
export class AppModule {}
