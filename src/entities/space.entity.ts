import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Topic } from './topic.entity';
import { UserSpaceRole } from './user_space_role.entity';
import { UserRole } from './user_role.entity';

@Entity('spaces')
export class Space {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ default: false })
  is_deleted: boolean;

  @OneToMany(() => Topic, (topic) => topic.space)
  topics: Topic[];

  @OneToMany(() => UserSpaceRole, (userSpaceRole) => userSpaceRole.space)
  userSpaceRoles: UserSpaceRole[];

  @OneToMany(() => UserRole, (userRole) => userRole.space)
  userRoles: UserRole[];
}
