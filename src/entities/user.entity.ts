import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserSpaceRole } from './user_space_role.entity';
import { UserSpacePermission } from './user_space_permission.entity';
import { UserTopicPermission } from './user_topic_permission.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  modified_at: Date;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @OneToMany(() => UserSpaceRole, (userSpaceRole) => userSpaceRole.user)
  userSpaceRoles: UserSpaceRole[];

  @OneToMany(
    () => UserSpacePermission,
    (userSpacePermission) => userSpacePermission.user,
  )
  userSpacePermissions: UserSpacePermission[];

  @OneToMany(
    () => UserTopicPermission,
    (userTopicPermission) => userTopicPermission.user,
  )
  userTopicPermissions: UserTopicPermission[];
}
