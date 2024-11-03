import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { Note } from './src/entities/note.entity';
import { Tag } from './src/entities/tag.entity';
import { NoteTag } from './src/entities/note_tag.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
  database: 'hoarder_notes_db',
  entities: [User, Note, Tag, NoteTag],
  migrations: ['src/migration/*.ts'],
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("Error during Data Source initialization:", err);
  });