import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from './user_role.entity';
import { SpacePermission } from './space_permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  role_id: number;

  @Column()
  permission_id: number;

  @ManyToOne(() => UserRole, (role) => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role: UserRole;

  @ManyToOne(() => SpacePermission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission: SpacePermission;
}
