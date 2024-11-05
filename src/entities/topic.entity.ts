import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Space } from './space.entity';
import { TopicAccessLevel } from './topic_access_level.entity';
import { Note } from './note.entity';
import { UserTopicPermission } from './user_topic_permission.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column()
  space_id: number;

  @Column({ default: false })
  is_deleted: boolean;

  @Column()
  access_level_id: number;

  @ManyToOne(() => Space, (space) => space.topics)
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @ManyToOne(() => TopicAccessLevel, (accessLevel) => accessLevel.topics)
  @JoinColumn({ name: 'access_level_id' })
  accessLevel: TopicAccessLevel;

  @OneToMany(() => Note, (note) => note.topic)
  notes: Note[];

  @OneToMany(
    () => UserTopicPermission,
    (userTopicPermission) => userTopicPermission.topic,
  )
  userTopicPermissions: UserTopicPermission[];
}
