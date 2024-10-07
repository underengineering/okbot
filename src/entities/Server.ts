import { Check, Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Server {
    @PrimaryKey()
    id!: number;

    @Property()
    hostname!: string;

    @Property()
    location!: string;

    @Property()
    @Check({ expression: `"port" >= 0 AND "port" < 65536` })
    port!: number;
}
