import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserSpaceRole } from './user_space_role.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string; // 'owner', 'moderator', 'member'

  @OneToMany(() => UserSpaceRole, (userSpaceRole) => userSpaceRole.role)
  userSpaceRoles: UserSpaceRole[];
}
