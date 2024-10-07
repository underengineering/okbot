import assert from "assert";
import { Logger } from "pino";

interface IDataLimit {
    bytes: number;
}

export interface IServer {
    hostname: string;
    port: number;
}

export interface ICreateKeyOpts {
    name?: string;
    method?: string;
    password?: string;
    port?: number;
    limit?: IDataLimit;
}

export interface ICreateKeyResp {
    id: string;
    name: string;
    password: string;
    port: number;
    method: string;
    accessUrl: string;
}

export interface IDeleteKeyOpts {
    id: string;
}

export class OutlineApiService {
    constructor(private readonly log: Logger) {}

    async createKey(
        server: IServer,
        opts: ICreateKeyOpts
    ): Promise<ICreateKeyResp> {
        const resp = await fetch(
            `https://${server.hostname}:${server.port}/ag6hmp1F9JLugoKJPhdiTQ/access-keys`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(opts),
            }
        );

        assert(resp.status === 201, "Unexpected response status");

        return resp.json();
    }

    async deleteKey(server: IServer, opts: IDeleteKeyOpts): Promise<void> {
        const resp = await fetch(
            `https://${server.hostname}:${server.port}/ag6hmp1F9JLugoKJPhdiTQ/access-keys/${opts.id}`,
            {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                },
            }
        );

        if (resp.status === 404)
            this.log.warn({ server, opts }, "Key does not exist?");
    }
}
