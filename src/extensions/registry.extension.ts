import { InternalError, is, SECOND, START, TContext, TServiceParams } from "@digital-alchemy/core";
import { ALL_DOMAINS, TRawDomains } from "@digital-alchemy/hass";
import { createHash } from "crypto";

import { BaseEntityParams, EntityConfigCommon, RemovableCallback, TSynapseId } from "..";

type BaseEntity = {
  attributes: object;
  _rawAttributes: object;
  _rawConfiguration: object;
  configuration: object;
  name: string;
  state: unknown;
  unique_id: string;
};

type SynapseSocketOptions = {
  context: TContext;
  domain: ALL_DOMAINS;
};

const BOOT_TIME = new Date().toISOString();

function generateHash(input: string) {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

type Configurable = { configuration: object };

function squishData<DATA extends Configurable>({ configuration, ...data }: DATA) {
  return {
    ...configuration,
    ...data,
  };
}

const formatObjectId = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replaceAll(/[^\d_a-z]+/g, "_")
    .replaceAll(/^_+|_+$/g, "")
    .replaceAll(/_+/g, "_");

export function Registry({
  lifecycle,
  logger,
  hass,
  cache,
  synapse,
  config,
  internal,
  context,
  event,
  scheduler,
}: TServiceParams) {
  const LOADERS = new Map<ALL_DOMAINS, () => object[]>();
  const CONFIG_FROM_UNIQUE_ID = new Map<TSynapseId, BaseEntityParams<unknown>>();
  const META_REGISTRY = new Map<TRawDomains, Map<TSynapseId, BaseEntity>>();
  type TDomain = ReturnType<typeof create>;
  const domains = new Map<ALL_DOMAINS, TDomain>();
  const initComplete = false;
  const getIdentifier = () => internal.boot.application.name;
  const name = (a: string) => [config.synapse.EVENT_NAMESPACE, a, getIdentifier()].join("/");

  function buildEntityState() {
    const domains = Object.fromEntries(
      [...LOADERS.keys()].map(domain => {
        const data = LOADERS.get(domain)();
        return [domain, data.map(i => squishData(i as Configurable))];
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
  lifecycle.onPostConfig(async function onPostConfig() {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.trace({ name: onPostConfig }, `starting heartbeat`);
    scheduler.interval({
      exec: async () => await hass.socket.fireEvent(name("heartbeat")),
      interval: config.synapse.HEARTBEAT_INTERVAL * SECOND,
    });
  });

  hass.socket.onConnect(async () => {
    logger.debug({ name: "onConnect" }, `reconnect heartbeat`);
    await hass.socket.fireEvent(name("heartbeat"));
  });

  lifecycle.onPreShutdown(async () => {
    logger.debug({ name: "onPreShutdown" }, `notifying synapse extension of shutdown`);
    await hass.socket.fireEvent(name("shutdown"));
  });

  // * Targeted at this app
  hass.socket.onEvent({
    context,
    event: name("reload"),
    async exec() {
      logger.info(`reload by app`);
      await SendEntityList();
    },
  });

  // * Targeted at all digital-alchemy apps
  hass.socket.onEvent({
    context,
    event: "digital_alchemy/reload",
    async exec() {
      logger.info(`reload global`);
      await SendEntityList();
    },
  });

  // # Domain registry
  function create<DATA extends BaseEntity>({
    domain,
    context,
  }: SynapseSocketOptions): TRegistry<DATA> {
    logger.trace({ name: domain }, `init domain`);
    const registry = new Map<TSynapseId, DATA>();
    META_REGISTRY.set(domain, registry);
    const CACHE_KEY = (unique_id: TSynapseId) => `${domain}_cache:${unique_id}`;

    // * Export the data for hass
    LOADERS.set(domain, () => {
      return [...registry.entries()].map(([unique_id, item]) => {
        return {
          attributes: item.attributes,
          ...item.configuration,
          state: item.state,
          unique_id,
        };
      });
    });

    // * Registry interactions
    const out = {
      // * Add
      add(data: DATA, entity: BaseEntityParams<unknown> & EntityConfigCommon) {
        const unique_id = (
          is.empty(entity.unique_id)
            ? generateHash(`${getIdentifier()}:${entity.name}`)
            : entity.unique_id
        ) as TSynapseId;
        if (registry.has(unique_id)) {
          throw new InternalError(context, `ENTITY_COLLISION`, `${domain} registry already id`);
        }
        // Without the suggested_object_id, home assistant will prefer using the unique_id to create the entity id
        entity.suggested_object_id ??= formatObjectId(entity.name);

        registry.set(unique_id, data);
        CONFIG_FROM_UNIQUE_ID.set(unique_id, entity);
        if (initComplete) {
          logger.warn({ context: context, domain, name: entity.name }, `late entity generation`);
        }
        logger.debug({ name: entity.name }, `register {%s}`, domain);
        return unique_id;
      },

      // * byId
      byId(unique_id: TSynapseId) {
        return registry.get(unique_id);
      },

      /**
       * The domain this registry was created with
       */
      domain,

      // * getCache
      async getCache<T>(unique_id: TSynapseId, defaultValue?: T): Promise<T> {
        return await cache.get(CACHE_KEY(unique_id), defaultValue);
      },

      // * list
      list() {
        return [...registry.keys()];
      },

      rawConfigById(unique_id: TSynapseId) {
        return CONFIG_FROM_UNIQUE_ID.get(unique_id);
      },

      // * send
      async send(unique_id: TSynapseId): Promise<void> {
        if (hass.socket.connectionState !== "connected") {
          logger.debug(
            { name: "send" },
            `socket connection isn't active, not sending update event`,
          );
          return;
        }
        const base = registry.get(unique_id);
        const data = squishData({ ...base, unique_id });
        await hass.socket.fireEvent(name("update"), {
          data,
          unique_id,
        });
      },
      // * setCache
      async setCache(unique_id: TSynapseId, value: DATA): Promise<void> {
        const update = {
          ...registry.get(unique_id),
          ...value,
        };
        registry.set(unique_id, update);
        await cache.set(CACHE_KEY(unique_id), update);
      },
    };
    domains.set(domain, out as unknown as TDomain);
    return out;
  }

  create.registeredDomains = domains;

  return {
    buildEntityState,

    /**
     * Listen for specific socket events, and transfer to internal event bus
     */
    busTransfer({ context, eventName, unique_id }: BusTransferOptions) {
      const formatted = new Map<string, string>();
      eventName.forEach(eventName => {
        const target = `synapse/${eventName}/${unique_id}`;
        formatted.set(formatEventName(eventName), target);
        const source = name(eventName);
        hass.socket.onEvent({
          context,
          event: source,
          exec({ data }: BaseEvent) {
            if (data.unique_id !== unique_id) {
              return;
            }
            event.emit(target, data);
          },
        });
        logger.debug({ source, target }, `setting up bus transfer`);
      });
      return {
        dynamicAttach(key: string) {
          const name = formatted.get(key);
          if (!name) {
            return undefined;
          }
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(name, callback);
        },
        keys: [...formatted.keys()],
        // TODO: it works but it is ugly
        staticAttach(proxy: object, entity: object) {
          eventName.forEach(key => {
            const name = formatEventName(key) as keyof typeof proxy;
            const value = entity[key as keyof typeof entity] as RemovableCallback;
            const callback = proxy[name] as (callback_: unknown) => void;
            if (is.function(value) && !is.empty(name) && is.function(callback)) {
              callback(value);
            }
          });
        },
      };
    },
    byId(id: TSynapseId) {
      const registry = [...META_REGISTRY.values()].find(item => !is.undefined(item.get(id)));
      return registry?.get(id);
    },
    create,
    eventName: name,
    /**
     * Generate an event listener that is easy to remove by developer
     */
    removableListener<DATA extends object>(eventName: string, callback: RemovableCallback<DATA>) {
      const remove = () => event.removeListener(eventName, exec);
      const exec = async (data: DATA) =>
        await internal.safeExec(async () => await callback(data, remove));
      event.on(eventName, exec);
      return { remove };
    },
  };
}

type BusTransferOptions = {
  context: TContext;
  eventName: string[];
  unique_id: TSynapseId;
};

type BaseEvent = {
  data: {
    unique_id: TSynapseId;
  };
};

export type TRegistry<DATA extends unknown = unknown> = {
  add(data: DATA, entity: { unique_id?: string }): TSynapseId;
  byId(unique_id: TSynapseId): DATA;
  domain: ALL_DOMAINS;
  rawConfigById(unique_id: TSynapseId): BaseEntityParams<unknown>;
  getCache<T>(unique_id: TSynapseId, defaultValue?: T): Promise<T>;
  list: () => TSynapseId[];
  send: (unique_id: TSynapseId, data: object) => Promise<void>;
  setCache: (unique_id: TSynapseId, value: DATA) => Promise<void>;
};

const EVERYTHING_ELSE = 1;
const formatEventName = (eventName: string) =>
  "on" +
  eventName
    .split("_")
    .map(i => i.charAt(START).toUpperCase() + i.slice(EVERYTHING_ELSE))
    .join("");
