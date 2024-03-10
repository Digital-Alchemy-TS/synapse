import {
  InternalError,
  is,
  SECOND,
  sleep,
  START,
  TBlackHole,
  TContext,
  TServiceParams,
  ZCC,
} from "@digital-alchemy/core";
import { ALL_DOMAINS } from "@digital-alchemy/core/hass";
import { createHash } from "crypto";

type BaseEntity = {
  name: string;
  icon?: string;
  unique_id?: string;
};

type SynapseSocketOptions<DATA extends object> = {
  context: TContext;
  domain: ALL_DOMAINS;
  details?: (data: DATA) => object;
};

const HEARTBEAT_INTERVAL = 5;
const BOOT_TIME = new Date().toISOString();
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
  context,
  scheduler,
}: TServiceParams) {
  // # Common
  const LOADERS = new Map<ALL_DOMAINS, () => object[]>();
  let initComplete = false;
  const HEARTBEAT = `digital_alchemy_heartbeat_${ZCC.application.name}`;

  async function SendEntityList() {
    logger.debug(`send entity list`);
    const domains = Object.fromEntries(
      [...LOADERS.keys()].map(domain => {
        const data = LOADERS.get(domain)();
        return [domain, data];
      }),
    );
    const hash = generateHash(JSON.stringify(domains));
    await hass.socket.fireEvent(`digital_alchemy_application_state`, {
      app: ZCC.application.name,
      boot: BOOT_TIME,
      domains,
      hash,
    });
  }

  // ## Heartbeat
  lifecycle.onPostConfig(async () => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.trace(`starting heartbeat`);
    scheduler.interval({
      exec: async () => await hass.socket.fireEvent(HEARTBEAT),
      interval: HEARTBEAT_INTERVAL * SECOND,
    });
  });

  lifecycle.onShutdownStart(async () => {
    logger.debug(`notifying synapse extension of shutdown`);
    await hass.socket.fireEvent(
      `digital_alchemy_application_shutdown_${ZCC.application.name}`,
    );
  });

  // ## Different opportunities to announce
  // ### At boot
  hass.socket.onConnect(async () => {
    initComplete = true;
    await hass.socket.fireEvent(HEARTBEAT);
    if (!config.synapse.ANNOUNCE_AT_CONNECT) {
      return;
    }
    logger.debug(`[socket connect] sending entity list`);
    await SendEntityList();
  });

  // ### Targeted at this app
  hass.socket.onEvent({
    context,
    event: "digital_alchemy_app_reload",
    exec: async ({ app }: { app: string }) => {
      if (app !== ZCC.application.name) {
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
  return function <DATA extends BaseEntity>({
    domain,
    context,
    details,
  }: SynapseSocketOptions<DATA>) {
    logger.trace({ name: domain }, `init domain`);
    const registry = new Map<string, DATA>();
    const CACHE_KEY = (id: string) => `${domain}_cache:${id}`;
    type TCallback = (argument: unknown) => TBlackHole;
    let LOAD_ME = new Set<{
      id: string;
      callback: TCallback;
    }>();
    const missingEntities = () =>
      [...LOAD_ME.values()].map(({ id }) => registry.get(id).name);
    let LOADED_SYNAPSE_DATA: Record<string, unknown>;

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
      id: string,
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
        logger.debug({ id }, `value restoration failed`);
        return;
      }
      logger.trace({ id, name: domain }, `adding lookup for entity`);
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
      logger.debug({ name: domain }, `retrieving state from synapse`);
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
            { domain, missing: missingEntities() },
            `retrying state retrieval...`,
          );
        }
        // send request for data
        await hass.socket.fireEvent(
          `digital_alchemy_retrieve_state_${domain}`,
          {
            app: ZCC.application.name,
          },
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
        { attempts: RETRY, missing: missingEntities(), name: domain },
        `could not retrieve current data from synapse`,
      );
      LOAD_ME = undefined;
      remove();
    });

    // ## Registry interactions
    return {
      // ### Add
      add(data: DATA) {
        const id = is.empty(data.unique_id)
          ? generateHash(`${ZCC.application.name}:${data.name}`)
          : data.unique_id;
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
            { context: context, name: domain },
            `late entity generation`,
          );
        }
        logger.debug({ name: data.name }, `register {%s}`, domain);
        return id;
      },
      // ### byId
      byId(id: string) {
        return registry.get(id);
      },

      // ### getCache
      async getCache<T>(id: string, defaultValue?: T): Promise<T> {
        return await cache.get(CACHE_KEY(id), defaultValue);
      },

      // ### loadFromHass
      loadFromHass,

      // ### send
      async send(id: string, data: object) {
        if (!hass.socket.getConnectionActive()) {
          logger.debug(
            `socket connection isn't active, not sending update event`,
          );
          return;
        }
        await hass.socket.fireEvent(`digital_alchemy_event`, { data, id });
      },
      // ### setCache
      async setCache(id: string, value: unknown) {
        await cache.set(CACHE_KEY(id), value);
      },
    };
  };
}
