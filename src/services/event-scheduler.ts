import { Logger } from "pino";

import { MikroORM, sql } from "@mikro-orm/postgresql";

import { ScheduledEvent } from "../entities/ScheduledEvent";

type TCallback = () => Promise<void>;

export interface IOpts {
    checkIntervalSec: number;

    orm: MikroORM;
    log: Logger;
}

export class EventSchedulerService {
    constructor(opts: IOpts) {
        this.orm = opts.orm;
        this.log = opts.log;
        this.checkIntervalSec = opts.checkIntervalSec;
    }

    private reschedule(event: ScheduledEvent) {
        event.firesAt = new Date(Date.now() + event.intervalSec * 1000);
    }

    private async checkScheduledEvents() {
        const em = this.orm.em.fork();
        return em.transactional(async () => {
            const eventsToFire = await this.orm.em.findAll(ScheduledEvent, {
                where: {
                    firesAt: {
                        $lte: sql`${sql.now()}`,
                    },
                },
            });

            if (eventsToFire.length === 0) return;

            this.log.info(
                { eventsToFire: eventsToFire.length },
                "Firing events"
            );

            const promises = [];
            for (const event of eventsToFire) {
                const promise = this.fireEvent(event.name);
                this.reschedule(event);

                promises.push(promise);
            }

            await Promise.all(promises);
        });
    }

    private fireEvent(name: string) {
        this.log.info({ name }, "Firing event");

        const callback = this.callbacks[name];
        if (callback !== undefined) return callback();
    }

    async schedule(name: string, intervalSec: number, callback: TCallback) {
        this.callbacks[name] = callback;

        // Check the database first
        const em = this.orm.em.fork();
        const event = await em.findOne(ScheduledEvent, { name });
        if (event === null) {
            // Fire immediately
            await this.fireEvent(name);

            // Schedule a new event
            const firesAt = new Date(Date.now() + intervalSec * 1000);
            const event = em.create(ScheduledEvent, {
                name,
                intervalSec,
                firesAt,
            });

            em.persistAndFlush(event);
        }
    }

    run() {
        this.intervalId = setInterval(
            () => this.checkScheduledEvents(),
            this.checkIntervalSec * 1000
        );
    }

    destroy() {
        if (this.intervalId !== undefined) clearInterval(this.intervalId);
    }

    private readonly callbacks: Record<string, TCallback> = {};

    private readonly orm: MikroORM;
    private readonly log: Logger;
    private readonly checkIntervalSec: number;

    private intervalId?: NodeJS.Timeout = undefined;
}
