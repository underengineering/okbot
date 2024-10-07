import assert from "assert";
import "dotenv/config";
import pino from "pino";
import { Telegraf } from "telegraf";

import { MikroORM, sql } from "@mikro-orm/postgresql";

import { OutlineKey } from "./entities/OutlineKey";
import { Server } from "./entities/Server";
import { EventSchedulerService } from "./services/event-scheduler";
import { OutlineApiService } from "./services/outline-api";

async function main() {
    assert(process.env.BOT_TOKEN !== undefined);
    assert(process.env.BOT_CHANNEL_ID !== undefined);

    // XXX:
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

    const log = pino();
    const orm = await MikroORM.init();

    const apiService = new OutlineApiService(log);
    const schedulerService = new EventSchedulerService({
        checkIntervalSec: 60, // Once in a minute

        orm,
        log,
    });

    const bot = new Telegraf(process.env.BOT_TOKEN);

    const KEY_CREATION_INTERVAL_SEC = 60 * 60 * 24;
    const KEY_EXPIRY_TIME_SEC = 60 * 60 * 24 * 2;
    schedulerService.schedule(
        "createKey",
        KEY_CREATION_INTERVAL_SEC,
        async () => {
            const em = orm.em.fork();

            // Get random server
            const servers = await em.findAll(Server);
            if (servers.length === 0) return;

            const server = servers[Math.floor(Math.random() * servers.length)];

            const key = await apiService.createKey(server, {});

            try {
                // Send to the channel
                await bot.telegram.sendMessage(
                    process.env.BOT_CHANNEL_ID!,
                    `🔑 Новый ключ на 48 часов
🌍 Локация: ${server.location}
💡 Инструкция - <a href="https://start.okbots.ru/">start.okbots.ru</a>

<code>${key.accessUrl}</code>

🚀 Купить премиум VPN со скоростью до 10 гб/с:
@okvpn_xbot`,
                    { parse_mode: "HTML" }
                );

                // Save to the database
                const expiresAt = new Date(Date.now() + KEY_EXPIRY_TIME_SEC);
                const keyEntity = em.create(OutlineKey, {
                    id: key.id,
                    name: key.name,
                    port: key.port,
                    accessUrl: key.accessUrl,
                    server,
                    expiresAt,
                });

                await em.persistAndFlush(keyEntity);

                log.info(
                    {
                        name: key.name,
                        hostname: server.hostname,
                        port: key.port,
                        accessUrl: key.accessUrl,
                    },
                    "Key saved"
                );
            } catch (err) {
                log.error({ err }, "Failed to send key");
                await apiService.deleteKey(server, key);
            }
        }
    );

    const KEY_DELETE_CHECK_INTERVAL_MS = 30 * 1000; //60 * 1000;
    const deleteKeysIntervalId = setInterval(async () => {
        const em = orm.em.fork();
        await em.transactional(async () => {
            const keysToDelete = await em.findAll(OutlineKey, {
                populate: ["server"],
                where: {
                    expiresAt: {
                        $lte: sql`${sql.now()}`,
                    },
                },
            });

            if (keysToDelete.length === 0) return;

            const promises = [];
            for (const key of keysToDelete) {
                log.info({ id: key.id, server: key.server }, "Deleting key");

                em.remove(key);

                const promise = apiService.deleteKey(key.server, key);
                promises.push(promise);
            }

            await Promise.all([em.flush(), ...promises]);
        });
    }, KEY_DELETE_CHECK_INTERVAL_MS);

    bot.launch();
    schedulerService.run();

    process.once("SIGINT", async () => {
        bot.stop("SIGINT");
        schedulerService.destroy();
        clearInterval(deleteKeysIntervalId);
        await orm.close();
    });

    process.once("SIGTERM", async () => {
        bot.stop("SIGTERM");
        schedulerService.destroy();
        clearInterval(deleteKeysIntervalId);
        await orm.close();
    });
}

main();
