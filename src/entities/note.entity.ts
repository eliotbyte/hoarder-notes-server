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
import { User } from './user.entity';
import { NoteTag } from './note_tag.entity';
import { Topic } from './topic.entity';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column('text')
  text: string;

  @Column({ nullable: true })
  parent_id: number;

  @Column()
  user_id: number;

  @Column()
  topic_id: number;

  @Column({ default: false })
  is_deleted: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => NoteTag, (noteTag) => noteTag.note)
  noteTags: NoteTag[];

  @ManyToOne(() => Topic, (topic) => topic.notes)
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;
}
