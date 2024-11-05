import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserSpaceRole } from './user_space_role.entity';
import { Space } from './space.entity';
import { RolePermission } from './role_permission.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column()
  space_id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'boolean' })
  is_custom: boolean;

  @Column({ type: 'boolean' })
  is_default: boolean;

  @ManyToOne(() => Space, (space) => space.userRoles)
  @JoinColumn({ name: 'space_id' })
  space: Space;

  @OneToMany(() => UserSpaceRole, (userSpaceRole) => userSpaceRole.role)
  userSpaceRoles: UserSpaceRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];
}
