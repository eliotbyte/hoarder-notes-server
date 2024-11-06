import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Topic } from './topic.entity';
import { UserRole } from './user_role.entity';

@Entity('topic_user_roles')
@Unique(['topic_id', 'role_id'])
export class TopicUserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column()
  topic_id: number;

  @Column()
  role_id: number;

  @ManyToOne(() => Topic, (topic) => topic.topicUserRoles)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @ManyToOne(() => UserRole, (role) => role.topicUserRoles)
  @JoinColumn({ name: 'role_id' })
  role: UserRole;
}
