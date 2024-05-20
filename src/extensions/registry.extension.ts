import {
  InternalError,
  is,
  SECOND,
  TBlackHole,
  TContext,
  TServiceParams,
} from "@digital-alchemy/core";
import { ALL_DOMAINS } from "@digital-alchemy/hass";
import { createHash } from "crypto";

import { TSynapseId } from "..";

type BaseEntity = {
  name: string;
  icon?: string;
  unique_id?: string;
};

type SynapseSocketOptions<DATA extends object> = {
  context: TContext;
  domain: ALL_DOMAINS;
  /**
   * used to export data for payloads to extension
   */
  details?: (data: DATA) => object;
};

const BOOT_TIME = new Date().toISOString();

function generateHash(input: string) {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

export function Registry({
  lifecycle,
  logger,
  hass,
  cache,
  config,
  internal,
  context,
  scheduler,
}: TServiceParams) {
  const LOADERS = new Map<ALL_DOMAINS, () => object[]>();
  type TDomain = ReturnType<typeof create>;
  const domains = new Map<ALL_DOMAINS, TDomain>();
  let initComplete = false;
  const getIdentifier = () => internal.boot.application.name;
  const name = (a: string) => ["digital_alchemy", a, getIdentifier()].join("/");

  function buildEntityState() {
    const domains = Object.fromEntries(
      [...LOADERS.keys()].map(domain => {
        const data = LOADERS.get(domain)();
        return [
          domain,
          data.map(i => {
            const { configuration, ...item } = i as { configuration: object };
            return {
              ...configuration,
              ...item,
            };
          }),
        ];
      }),
    );
    const hash = generateHash(JSON.stringify(domains));
    return {
      boot: BOOT_TIME,
      ...domains,
      hash,
    };
  }

  // * SendEntityList
  async function SendEntityList() {
    logger.debug({ name: SendEntityList }, `send entity list`);
    await hass.socket.fireEvent(name("configuration"), buildEntityState());
  }

  // * Heartbeat
  lifecycle.onPostConfig(async () => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.trace({ name: "onPostConfig" }, `starting heartbeat`);
    scheduler.interval({
      exec: async () => await hass.socket.fireEvent(name("heartbeat")),
      interval: config.synapse.HEARTBEAT_INTERVAL * SECOND,
    });
  });

  lifecycle.onPreShutdown(async () => {
    logger.debug(
      { name: "onPreShutdown" },
      `notifying synapse extension of shutdown`,
    );
    await hass.socket.fireEvent(name("shutdown"));
  });

  // * Different opportunities to announce
  // * At boot
  hass.socket.onConnect(async () => {
    initComplete = true;
    await hass.socket.fireEvent(name("heartbeat"));
    if (!config.synapse.ANNOUNCE_AT_CONNECT) {
      return;
    }
    logger.debug({ name: "onConnect" }, `[socket connect] sending entity list`);
    await SendEntityList();
  });

  // * Targeted at this app
  hass.socket.onEvent({
    context,
    event: name("reload"),
    exec: async () => {
      logger.info(`reload by app`);
      await SendEntityList();
    },
  });

  // * Targeted at all digital-alchemy apps
  hass.socket.onEvent({
    context,
    event: "digital_alchemy/reload",
    exec: async () => {
      logger.info(`reload global`);
      await SendEntityList();
    },
  });

  // # Domain registry
  function create<DATA extends BaseEntity>({
    domain,
    context,
    details,
  }: SynapseSocketOptions<DATA>): TRegistry<DATA> {
    logger.trace({ name: domain }, `init domain`);
    const registry = new Map<TSynapseId, DATA>();
    const CACHE_KEY = (id: TSynapseId) => `${domain}_cache:${id}`;

    // * Export the data for hass
    LOADERS.set(domain, () => {
      return [...registry.entries()].map(([id, item]) => {
        return {
          ...(details ? details(item) : {}),
          icon: is.empty(item.icon) ? undefined : `mdi:${item.icon}`,
          id,
          name: item.name,
        };
      });
    });

    // * Registry interactions
    const out = {
      // * Add
      add(data: DATA) {
        const id = (
          is.empty(data.unique_id)
            ? generateHash(`${getIdentifier()}:${data.name}`)
            : data.unique_id
        ) as TSynapseId;
        if (registry.has(id)) {
          throw new InternalError(
            context,
            `ENTITY_COLLISION`,
            `${domain} registry already id`,
          );
        }
        registry.set(id, data);
        if (initComplete) {
          logger.warn(
            { context: context, domain, name: data.name },
            `late entity generation`,
          );
        }
        logger.debug({ name: data.name }, `register {%s}`, domain);
        return id;
      },

      // * byId
      byId(id: TSynapseId) {
        return registry.get(id);
      },

      /**
       * The domain this registry was created with
       */
      domain,

      generate<RESULT extends object>(
        callback: (options: DATA, id: TSynapseId) => TBlackHole,
      ) {
        return function (options: DATA): RESULT {
          const id = out.add(options);
          callback(options, id);
          return undefined;
        };
      },

      // * getCache
      async getCache<T>(id: TSynapseId, defaultValue?: T): Promise<T> {
        return await cache.get(CACHE_KEY(id), defaultValue);
      },

      // * list
      list() {
        return [...registry.keys()];
      },

      // * send
      async send(id: TSynapseId, data: object): Promise<void> {
        if (hass.socket.connectionState !== "connected") {
          logger.debug(
            { name: "send" },
            `socket connection isn't active, not sending update event`,
          );
          return;
        }
        await hass.socket.fireEvent(name("event"), {
          data,
          id,
        });
      },
      // * setCache
      async setCache(id: TSynapseId, value: unknown): Promise<void> {
        await cache.set(CACHE_KEY(id), value);
      },
    };
    domains.set(domain, out as unknown as TDomain);
    return out;
  }
  create.registeredDomains = domains;
  return { buildEntityState, create };
}

export type TRegistry<DATA extends unknown = unknown> = {
  add(data: DATA): TSynapseId;
  byId(id: TSynapseId): DATA;
  domain: ALL_DOMAINS;
  generate<RESULT extends object>(
    callback: (options: DATA, id: TSynapseId) => TBlackHole,
  ): (options: DATA) => RESULT;
  getCache<T>(id: TSynapseId, defaultValue?: T): Promise<T>;
  list: () => TSynapseId[];
  send: (id: TSynapseId, data: object) => Promise<void>;
  setCache: (id: TSynapseId, value: unknown) => Promise<void>;
};
