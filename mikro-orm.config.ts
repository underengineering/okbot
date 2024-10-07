import assert from "assert";
import "dotenv/config";

import { Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

assert(process.env.DB_HOSTNAME !== undefined);
assert(process.env.DB_USERNAME !== undefined);
assert(process.env.DB_PASSWORD !== undefined);
assert(process.env.DB_NAME !== undefined);

const config: Options = {
    // for simplicity, we use the SQLite database, as it's available pretty much everywhere
    driver: PostgreSqlDriver,

    host: process.env.DB_HOSTNAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dbName: process.env.DB_NAME,

    forceUtcTimezone: true,

    // folder-based discovery setup, using common filename suffix
    entities: ["dist/entities/*.js"],
    entitiesTs: ["src/entities/*.ts"],

    // we will use the ts-morph reflection, an alternative to the default reflect-metadata provider
    // check the documentation for their differences: https://mikro-orm.io/docs/metadata-providers
    metadataProvider: TsMorphMetadataProvider,

    // enable debug mode to log SQL queries and discovery information
    debug: true,
};

export default config;
