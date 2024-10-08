import { Migration } from "@mikro-orm/migrations";

export class Migration20241008111103 extends Migration {
    override async up(): Promise<void> {
        this.addSql(
            `create table "scheduled_event" ("id" serial primary key, "name" varchar(255) not null, "interval_sec" int not null, "fires_at" timestamp not null, constraint scheduled_event_interval_sec_check check ("interval_sec" > 0));`
        );

        this.addSql(
            `create table "server" ("id" serial primary key, "hostname" varchar(255) not null, "location" varchar(255) not null, "port" int not null, constraint server_port_check check ("port" >= 0 AND "port" < 65536));`
        );

        this.addSql(
            `create table "outline_key" ("id" varchar(255) not null, "name" varchar(255) not null, "port" int not null, "access_url" varchar(255) not null, "server_id" int not null, "expires_at" timestamp not null, constraint "outline_key_pkey" primary key ("id"));`
        );

        this.addSql(
            `alter table "outline_key" add constraint "outline_key_server_id_foreign" foreign key ("server_id") references "server" ("id") on update cascade;`
        );
    }
}
