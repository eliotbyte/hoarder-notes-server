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
import { Space } from './space.entity';
import { SpacePermission } from './space_permission.entity';

@Entity('user_space_permissions')
export class UserSpacePermission {
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
  permission_id: number;

  @ManyToOne(() => User, (user) => user.userSpacePermissions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Space, (space) => space.userSpacePermissions)
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @ManyToOne(
    () => SpacePermission,
    (permission) => permission.userSpacePermissions,
  )
  @JoinColumn({ name: 'permission_id' })
  permission: SpacePermission;
}
