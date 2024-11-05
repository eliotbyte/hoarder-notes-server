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
import { User } from './user.entity';
import { Space } from './space.entity';
import { UserRole } from './user_role.entity';

@Entity('user_space_roles')
@Unique(['user_id', 'space_id'])
export class UserSpaceRole {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column()
  user_id: number;

  @Column()
  space_id: number;

  @Column()
  role_id: number;

  @ManyToOne(() => User, (user) => user.userSpaceRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Space, (space) => space.userSpaceRoles)
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @ManyToOne(() => UserRole, (role) => role.userSpaceRoles)
  @JoinColumn({ name: 'role_id' })
  role: UserRole;
}
