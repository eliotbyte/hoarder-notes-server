import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { UsersModule } from './users/users.module';
import { SpacesModule } from './spaces/spaces.module';
import { TopicsModule } from './topics/topics.module';
import { InitialDataModule } from './initial-data/initial-data.module';

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
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      synchronize: true,
    }),
    AuthModule,
    NotesModule,
    UsersModule,
    SpacesModule,
    TopicsModule,
    InitialDataModule,
  ],
})
export class AppModule {}
