import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserSpacePermission } from './user_space_permission.entity';

@Entity('space_permissions')
export class SpacePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string; // 'create', 'edit', 'create_private', 'delete'

  @OneToMany(
    () => UserSpacePermission,
    (userSpacePermission) => userSpacePermission.permission,
  )
  userSpacePermissions: UserSpacePermission[];
}
