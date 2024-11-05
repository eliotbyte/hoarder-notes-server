import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Topic } from './topic.entity';
import { TopicPermission } from './topic_permission.entity';

@Entity('user_topic_permissions')
export class UserTopicPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column()
  user_id: number;

  @Column()
  topic_id: number;

  @Column()
  permission_id: number;

  @ManyToOne(() => User, (user) => user.userTopicPermissions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Topic, (topic) => topic.userTopicPermissions)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(
    () => TopicPermission,
    (permission) => permission.userTopicPermissions,
  )
  @JoinColumn({ name: 'permission_id' })
  permission: TopicPermission;
}
