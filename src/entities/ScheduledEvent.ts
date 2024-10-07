import { Check, Entity, Opt, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class ScheduledEvent {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @Property()
    @Check({ expression: `"interval_sec" > 0` })
    intervalSec!: number;

    @Property({ columnType: "timestamp" })
    firesAt!: Date;
}
