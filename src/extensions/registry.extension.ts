import {
  InternalError,
  is,
  SECOND,
  sleep,
  START,
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
// anecdotally, it only needs a single retry
// can't think of what a 2nd might accomplish, let alone 3rd
const RETRY = 3;

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
  // # Common
  const LOADERS = new Map<ALL_DOMAINS, () => object[]>();
  type TDomain = ReturnType<typeof create>;
  const domains = new Map<ALL_DOMAINS, TDomain>();
  let initComplete = false;
  const getIdentifier = () =>
    config.synapse.APPLICATION_IDENTIFIER || internal.boot.application.name;

  async function SendEntityList() {
    logger.debug(`send entity list`);
    const domains = Object.fromEntries(
      [...LOADERS.keys()].map(domain => {
        const data = LOADERS.get(domain)();
        return [domain, data];
      }),
    );
    const hash = generateHash(JSON.stringify(domains));
    await hass.socket.fireEvent(
      `digital_alchemy_application_state`,
      { app: getIdentifier(), boot: BOOT_TIME, domains, hash },
      false,
    );
  }

  // ## Heartbeat
  lifecycle.onPostConfig(async () => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.trace({ name: "onPostConfig" }, `starting heartbeat`);
    scheduler.interval({
      exec: async () =>
        await hass.socket.fireEvent(
          `digital_alchemy_heartbeat_${getIdentifier()}`,
          {},
          false,
        ),
      interval: config.synapse.HEARTBEAT_INTERVAL * SECOND,
    });
  });

  lifecycle.onPreShutdown(async () => {
    logger.debug(
      { name: "onPreShutdown" },
      `notifying synapse extension of shutdown`,
    );
    await hass.socket.fireEvent(
      `digital_alchemy_application_shutdown_${getIdentifier()}`,
      {},
      false,
    );
  });

  // ## Different opportunities to announce
  // ### At boot
  hass.socket.onConnect(async () => {
    initComplete = true;
    await hass.socket.fireEvent(
      `digital_alchemy_heartbeat_${getIdentifier()}`,
      {},
      false,
    );
    if (!config.synapse.ANNOUNCE_AT_CONNECT) {
      return;
    }
    logger.debug({ name: "onConnect" }, `[socket connect] sending entity list`);
    await SendEntityList();
  });

  // ### Targeted at this app
  hass.socket.onEvent({
    context,
    event: "digital_alchemy_app_reload",
    exec: async ({ app }: { app: string }) => {
      if (app !== getIdentifier()) {
        return;
      }
      logger.info(`digital-alchemy.reload(%s)`, app);
      await SendEntityList();
    },
  });

  // ### Targeted at all digital-alchemy apps
  hass.socket.onEvent({
    context,
    event: "digital_alchemy_app_reload_all",
    exec: async () => {
      logger.info({ all: true }, `digital-alchemy.reload()`);
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
    type TCallback = (argument: unknown) => TBlackHole;
    let LOAD_ME = new Set<{
      id: TSynapseId;
      callback: TCallback;
    }>();
    const missingEntities = () =>
      [...LOAD_ME.values()].map(({ id }) => registry.get(id).name);
    let LOADED_SYNAPSE_DATA: Record<TSynapseId, unknown>;

    // ## Export the data for hass
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

    // ## Value restoration
    function loadFromHass<T extends object>(
      id: TSynapseId,
      callback: (argument: T) => void,
    ) {
      // ? loading already occurred, acts as a flag and minor garbage collection
      if (!LOAD_ME) {
        if (LOADED_SYNAPSE_DATA && LOADED_SYNAPSE_DATA[id]) {
          // load from the snapshot
          //
          // > thoughts on data desync
          //
          // it's not clear why this entity is being loaded later, or even how much later this is
          //   however, if it existed in the past, and came from this app, then it's value
          //   should be in the snapshot
          //
          // i don't believe there is a way for the data to update inside synapse if all the assumptions hold true
          // snapshot should contain last known value, even if we're generating the entity 2 days after boot for some reason
          //
          callback(LOADED_SYNAPSE_DATA[id] as T);
          return;
        }
        // not so lucky
        logger.debug({ id, name: loadFromHass }, `value restoration failed`);
        return;
      }
      logger.trace(
        { domain, id, name: loadFromHass },
        `adding lookup for entity`,
      );
      LOAD_ME.add({ callback: callback as TCallback, id });
    }

    // What is visible on the dashboard is considered the second source of truth
    // If an entity wants a state, but it wasn't able to load it from cache, it will come here
    // Will do a quick lookup of what the extension thinks the value is, and use that to set
    // > Rebooting hass could be done to clear out the values if needed
    // > Need to go through synapse based side channels to avoid retrieving an "unavailable" state
    hass.socket.onConnect(async () => {
      if (is.empty(LOAD_ME)) {
        return;
      }
      logger.debug(
        { domain, name: "onConnect" },
        `retrieving state from synapse`,
      );
      let loaded = false;
      // listen for reply
      const remove = hass.socket.onEvent({
        context,
        event: `digital_alchemy_respond_state_${domain}`,
        exec: ({ data }: { data: Record<string, unknown> }) => {
          loaded = true;
          LOADED_SYNAPSE_DATA = data;
          LOAD_ME.forEach(item => {
            const { id, callback } = item;
            callback(data[id] as object);
            LOAD_ME.delete(item);
          });
          LOAD_ME = undefined;
        },
        once: true,
      });

      for (let i = START; i <= RETRY; i++) {
        if (i > START) {
          logger.warn(
            { domain, missing: missingEntities(), name: "onConnect" },
            `retrying state retrieval...`,
          );
        }
        // send request for data
        await hass.socket.fireEvent(
          `digital_alchemy_retrieve_state_${domain}`,
          { app: getIdentifier() },
          false,
        );
        // wait 1 second
        await sleep(SECOND);
        if (loaded) {
          return;
        }
      }
      //
      // give up
      //
      // This can occur when the extension has not seen this app yet.
      // Maybe this app was brought offline with no persistent cache, and hass was reset?
      //
      // It can call digital-alchemy.reload() to register this app to properly fulfill this request
      // But it still wouldn't cause that data to be revived.
      // Hopefully sane logic for value defaulting was put in
      //

      logger.warn(
        {
          attempts: RETRY,
          domain,
          missing: missingEntities(),
          name: "onConnect",
        },
        `could not retrieve current data from synapse`,
      );
      LOAD_ME = undefined;
      remove();
    });

    // ## Registry interactions
    const out = {
      // ### Add
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

      // ### byId
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

      // ### getCache
      async getCache<T>(id: TSynapseId, defaultValue?: T): Promise<T> {
        return await cache.get(CACHE_KEY(id), defaultValue);
      },

      // ### list
      list() {
        return [...registry.keys()];
      },

      // ### loadFromHass
      loadFromHass,
      // ### send
      async send(id: TSynapseId, data: object): Promise<void> {
        if (hass.socket.connectionState !== "connected") {
          logger.debug(
            { name: "send" },
            `socket connection isn't active, not sending update event`,
          );
          return;
        }
        await hass.socket.fireEvent(
          `digital_alchemy_event`,
          { data, id },
          false,
        );
      },
      // ### setCache
      async setCache(id: TSynapseId, value: unknown): Promise<void> {
        await cache.set(CACHE_KEY(id), value);
      },
    };
    domains.set(domain, out as unknown as TDomain);
    return out;
  }
  create.registeredDomains = domains;
  return create;
}

export type TRegistry<DATA extends unknown = unknown> = {
  add(data: DATA): TSynapseId;
  byId(id: TSynapseId): DATA;
  domain: ALL_DOMAINS;
  generate<RESULT extends object>(
    callback: (options: DATA, id: TSynapseId) => TBlackHole,
  ): (options: DATA) => RESULT;
  getCache<T>(id: TSynapseId, defaultValue?: T): Promise<T>;
  loadFromHass: <T extends object>(
    id: TSynapseId,
    callback: (argument: T) => void,
  ) => void;
  list: () => TSynapseId[];
  send: (id: TSynapseId, data: object) => Promise<void>;
  setCache: (id: TSynapseId, value: unknown) => Promise<void>;
};
