import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Topic } from './topic.entity';

@Entity('topic_access_levels')
export class TopicAccessLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string; // 'public' or 'private'

  @OneToMany(() => Topic, (topic) => topic.accessLevel)
  topics: Topic[];
}
