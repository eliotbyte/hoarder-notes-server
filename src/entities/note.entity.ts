import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	ManyToOne,
	JoinColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
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
  
	@Column({ default: false })
	is_deleted: boolean;
  
	@ManyToOne(() => User)
	@JoinColumn({ name: 'user_id' })
	user: User;
  }
  