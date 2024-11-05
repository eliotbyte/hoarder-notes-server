import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBasicTables1730764417684 implements MigrationInterface {
    name = 'CreateBasicTables1730764417684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "topic_access_levels" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "PK_82f11ce9e998cbbba0e5d214b8d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(50) NOT NULL, CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "note_tags" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "note_id" integer NOT NULL, "tag_id" integer NOT NULL, CONSTRAINT "PK_ca61a805f00b069d6a9ec15b56b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notes" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "text" text NOT NULL, "parent_id" integer, "user_id" integer NOT NULL, "topic_id" integer NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "topic_permissions" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "PK_f09e949e64e8974bcc4814e0866" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_topic_permissions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "topic_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_4333b727ae67ec2b01e356a8075" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "topics" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "space_id" integer NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, "access_level_id" integer NOT NULL, CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "space_permissions" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "PK_f79b6c6a7c6d8f24a87422ed708" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_space_permissions" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "space_id" integer NOT NULL, "permission_id" integer NOT NULL, CONSTRAINT "PK_b32bf89ec899aba59720b91f386" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "spaces" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "is_deleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_dbe542974aca57afcb60709d4c8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" SERIAL NOT NULL, "name" character varying(50) NOT NULL, CONSTRAINT "PK_8acd5cf26ebd158416f477de799" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_space_roles" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "space_id" integer NOT NULL, "role_id" integer NOT NULL, CONSTRAINT "UQ_aaf30e838f76bf6e3722b9c1257" UNIQUE ("user_id", "space_id"), CONSTRAINT "PK_e5bce6f814c2a1f86fc5991fa58" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "modified_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(100) NOT NULL, "password_hash" character varying(255) NOT NULL, CONSTRAINT "UQ_51b8b26ac168fbe7d6f5653e6cf" UNIQUE ("name"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "note_tags" ADD CONSTRAINT "FK_6fa35b8ead30ef28cc1ac377b21" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note_tags" ADD CONSTRAINT "FK_898115de9eadba996d4323ff0b6" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_7708dcb62ff332f0eaf9f0743a7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notes" ADD CONSTRAINT "FK_5e7f26299defc07df120e06b2a6" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_topic_permissions" ADD CONSTRAINT "FK_00263081d135c505ba0eafd3103" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_topic_permissions" ADD CONSTRAINT "FK_2f783cfbdcec0817d6445a791eb" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_topic_permissions" ADD CONSTRAINT "FK_baf56b1d25274f5261e4bcb2dc9" FOREIGN KEY ("permission_id") REFERENCES "topic_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_1d577655c993ac61a22ed1e67b8" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_e1a7b9a89cd71713d49ef011735" FOREIGN KEY ("access_level_id") REFERENCES "topic_access_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_space_permissions" ADD CONSTRAINT "FK_78461950d30bc9aa6da995f326e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_space_permissions" ADD CONSTRAINT "FK_a85e41ef8e4699ce0c1d677c127" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_space_permissions" ADD CONSTRAINT "FK_a45f5cfe48bfef485506581ebe4" FOREIGN KEY ("permission_id") REFERENCES "space_permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_space_roles" ADD CONSTRAINT "FK_d85931815051e38340b750174c9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_space_roles" ADD CONSTRAINT "FK_db85d251fa65ca0f92c7945d74f" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_space_roles" ADD CONSTRAINT "FK_3607c5e2b52526793777d3c0b4e" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_space_roles" DROP CONSTRAINT "FK_3607c5e2b52526793777d3c0b4e"`);
        await queryRunner.query(`ALTER TABLE "user_space_roles" DROP CONSTRAINT "FK_db85d251fa65ca0f92c7945d74f"`);
        await queryRunner.query(`ALTER TABLE "user_space_roles" DROP CONSTRAINT "FK_d85931815051e38340b750174c9"`);
        await queryRunner.query(`ALTER TABLE "user_space_permissions" DROP CONSTRAINT "FK_a45f5cfe48bfef485506581ebe4"`);
        await queryRunner.query(`ALTER TABLE "user_space_permissions" DROP CONSTRAINT "FK_a85e41ef8e4699ce0c1d677c127"`);
        await queryRunner.query(`ALTER TABLE "user_space_permissions" DROP CONSTRAINT "FK_78461950d30bc9aa6da995f326e"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_e1a7b9a89cd71713d49ef011735"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_1d577655c993ac61a22ed1e67b8"`);
        await queryRunner.query(`ALTER TABLE "user_topic_permissions" DROP CONSTRAINT "FK_baf56b1d25274f5261e4bcb2dc9"`);
        await queryRunner.query(`ALTER TABLE "user_topic_permissions" DROP CONSTRAINT "FK_2f783cfbdcec0817d6445a791eb"`);
        await queryRunner.query(`ALTER TABLE "user_topic_permissions" DROP CONSTRAINT "FK_00263081d135c505ba0eafd3103"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_5e7f26299defc07df120e06b2a6"`);
        await queryRunner.query(`ALTER TABLE "notes" DROP CONSTRAINT "FK_7708dcb62ff332f0eaf9f0743a7"`);
        await queryRunner.query(`ALTER TABLE "note_tags" DROP CONSTRAINT "FK_898115de9eadba996d4323ff0b6"`);
        await queryRunner.query(`ALTER TABLE "note_tags" DROP CONSTRAINT "FK_6fa35b8ead30ef28cc1ac377b21"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_space_roles"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP TABLE "spaces"`);
        await queryRunner.query(`DROP TABLE "user_space_permissions"`);
        await queryRunner.query(`DROP TABLE "space_permissions"`);
        await queryRunner.query(`DROP TABLE "topics"`);
        await queryRunner.query(`DROP TABLE "user_topic_permissions"`);
        await queryRunner.query(`DROP TABLE "topic_permissions"`);
        await queryRunner.query(`DROP TABLE "notes"`);
        await queryRunner.query(`DROP TABLE "note_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP TABLE "topic_access_levels"`);
    }

}
