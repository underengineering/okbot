import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/core";

import { Server } from "./Server";

@Entity()
export class OutlineKey {
    @PrimaryKey()
    id!: string;

    @Property()
    name!: string;

    @Property()
    port!: number;

    @Property()
    accessUrl!: string;

    @ManyToOne({ nullable: false })
    server!: Server;

    @Property({ columnType: "timestamp" })
    expiresAt!: Date;
}
