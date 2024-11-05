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
import { Note } from './note.entity';

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

  @ManyToOne(() => Space, (space) => space.topics)
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @OneToMany(() => Note, (note) => note.topic)
  notes: Note[];
}
