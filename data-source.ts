import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { Note } from './src/entities/note.entity';
import { Tag } from './src/entities/tag.entity';
import { NoteTag } from './src/entities/note_tag.entity';
import { Space } from './src/entities/space.entity';
import { Topic } from './src/entities/topic.entity';
import { TopicAccessLevel } from './src/entities/topic_access_level.entity';
import { TopicPermission } from './src/entities/topic_permission.entity';
import { SpacePermission } from './src/entities/space_permission.entity';
import { UserSpaceRole } from './src/entities/user_space_role.entity';
import { UserTopicPermission } from './src/entities/user_topic_permission.entity';
import { UserSpacePermission } from './src/entities/user_space_permission.entity';
import { UserRole } from './src/entities/user_role.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
  database: 'hoarder_notes_db',
  entities: [
    User,
    Note,
    Tag,
    NoteTag,
    Space,
    Topic,
    TopicAccessLevel,
    TopicPermission,
    SpacePermission,
    UserSpaceRole,
    UserTopicPermission,
    UserSpacePermission,
    UserRole,
  ],
  migrations: ['src/migration/*.ts'],
  synchronize: false,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
  });
