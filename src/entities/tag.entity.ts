import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
  } from 'typeorm';
  
  @Entity('tags')
  export class Tag {
	@PrimaryGeneratedColumn()
	id: number;
  
	@CreateDateColumn({ type: 'timestamp' })
	created_at: Date;
  
	@UpdateDateColumn({ type: 'timestamp' })
	modified_at: Date;
  
	@Column({ type: 'varchar', length: 50 })
	name: string;
  }
  