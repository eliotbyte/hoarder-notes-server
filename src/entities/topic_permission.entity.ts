import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserTopicPermission } from './user_topic_permission.entity';

@Entity('topic_permissions')
export class TopicPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string; // 'read', 'create', 'delete', 'edit'

  @OneToMany(
    () => UserTopicPermission,
    (userTopicPermission) => userTopicPermission.permission,
  )
  userTopicPermissions: UserTopicPermission[];
}
