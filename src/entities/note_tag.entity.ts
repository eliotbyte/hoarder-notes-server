import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Note } from './note.entity';
import { Tag } from './tag.entity';

@Entity('note_tags')
export class NoteTag {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column()
  note_id: number;

  @Column()
  tag_id: number;

  @ManyToOne(() => Note, (note) => note.noteTags)
  @JoinColumn({ name: 'note_id' })
  note: Note;

  @ManyToOne(() => Tag, (tag) => tag.noteTags)
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
