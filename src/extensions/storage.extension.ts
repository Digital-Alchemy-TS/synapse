import {
  BootstrapException,
  deepExtend,
  each,
  is,
  NOT_FOUND,
  START,
  TBlackHole,
  TServiceParams,
} from "@digital-alchemy/core";
import { existsSync, mkdirSync, renameSync, statSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { cwd } from "process";

import {
  ENTITY_SET_ATTRIBUTE,
  STORAGE_BOOTSTRAP_PRIORITY,
  TSynapseId,
} from "..";
import { TRegistry } from ".";

type StorageData<STATE, ATTRIBUTES> = {
  state?: STATE;
  attributes?: ATTRIBUTES;
};
type ValueLoader = <STATE, ATTRIBUTES>(
  id: string,
  registry: TRegistry,
) => Promise<StorageData<STATE, ATTRIBUTES>>;

type LoaderOptions<STATE, ATTRIBUTES extends object> = {
  registry: TRegistry<unknown>;
  id: TSynapseId;
  name: string;
  value: StorageData<STATE, ATTRIBUTES>;
};

type TCallback<STATE, ATTRIBUTES extends object> = (
  new_state: StorageData<STATE, ATTRIBUTES>,
  old_state: StorageData<STATE, ATTRIBUTES>,
) => TBlackHole;

export function ValueStorage({
  logger,
  synapse,
  lifecycle,
  internal,
  context,
  config,
}: TServiceParams) {
  lifecycle.onPostConfig(() => {
    if (config.synapse.STORAGE !== "file") {
      return;
    }
    // #region file storage init
    // APPLICATION_IDENTIFIER > app name
    const APP_NAME = is.empty(config.synapse.APPLICATION_IDENTIFIER)
      ? internal.boot.application.name
      : config.synapse.APPLICATION_IDENTIFIER;

    const localConfig = join(cwd(), APP_NAME);
    const file = is.empty(config.synapse.STORAGE_FILE_LOCATION)
      ? localConfig
      : config.synapse.STORAGE_FILE_LOCATION;
    if (!existsSync(file)) {
      // not a file, not a directory
      logger.warn(
        { name: "onBootstrap", path: file },
        `creating storage folder`,
      );
      mkdirSync(file, { recursive: true });
      return;
    }
    const stat = statSync(file);
    if (stat.isDirectory()) {
      return;
    }
    // ! file folder conflicts
    if (stat.isFile()) {
      const destination = join(file, "config");
      const tempFile = join(tmpdir(), `synapse-${APP_NAME}-${Date.now()}`);
      logger.warn(
        { tempFile },
        "{%s} is a file, moving to {%s}",
        file,
        destination,
      );

      logger.trace("renameSync {%s} => {%s}", file, tempFile);
      renameSync(file, tempFile);

      logger.trace("mkdirSync {%s}", file);
      mkdirSync(file);

      logger.trace("renameSync {%s} => {%s}", file, tempFile);
      renameSync(tempFile, destination);
      return;
    }
    // ??? WAT
    throw new BootstrapException(
      context,
      "BAD_STORAGE_FILE",
      `${file} is not a valid file storage target`,
    );
    // #endregion
  }, STORAGE_BOOTSTRAP_PRIORITY);

  // #MARK: Loaders
  async function CacheLoader(id: TSynapseId, registry: TRegistry) {
    logger.trace({ id }, "CacheLoader");
    return registry.getCache(id);
  }
  async function HassLoader(id: TSynapseId, registry: TRegistry) {
    logger.trace({ id }, "HassLoader");

    return new Promise(done => {
      registry.loadFromHass(id, data => {
        if (is.empty(data)) {
          // wat
          return;
        }
        logger.debug({ data, id }, `received value`);
        done(data);
      });
    });
  }

  // #MARK: return object
  return {
    CacheLoader,
    HassLoader,

    loader<STATE, ATTRIBUTES extends object>({
      registry,
      id,
      name,
      value,
    }: LoaderOptions<STATE, ATTRIBUTES>) {
      // #MARK: value init
      const domain = registry.domain;
      lifecycle.onBootstrap(async () => {
        const loaders = synapse.storage.storage.load;
        await each(registry.list(), async (id: TSynapseId) => {
          for (let i = START; i <= loaders.length; i++) {
            const result = await loaders[i](id, registry);
            if (result) {
              break;
            }
          }
          logger.debug(
            { domain, name },
            "could not determine current value, keeping default",
          );
        });
      });
      async function store() {
        await registry.setCache(id, {
          attributes: entity.attributes,
          state: entity.state,
        });
      }

      const callbacks = [] as TCallback<STATE, ATTRIBUTES>[];

      function RunCallbacks(data: StorageData<STATE, ATTRIBUTES>) {
        setImmediate(async () => {
          await store();
          const current = {
            attributes: entity.attributes,
            state: entity.state,
          };
          await registry.send(id, current);
          await each(
            callbacks,
            async callback =>
              await internal.safeExec(
                async () => await callback(current, data),
              ),
          );
        });
      }

      // #MARK: storage commands
      const entity = {
        attributes: value.attributes,

        onUpdate() {
          return (callback: TCallback<STATE, ATTRIBUTES>) => {
            callbacks.push(callback);
            return () => {
              const index = callbacks.indexOf(callback);
              if (index !== NOT_FOUND) {
                callbacks.splice(callbacks.indexOf(callback));
              }
            };
          };
        },

        setAttribute<
          KEY extends keyof ATTRIBUTES,
          VALUE extends ATTRIBUTES[KEY],
        >(key: KEY, incoming: VALUE) {
          if (is.equal(entity.attributes[key], incoming)) {
            return;
          }
          const current = deepExtend(
            {},
            {
              attributes: entity.attributes,
              state: entity.state,
            },
          );
          value.attributes[key] = incoming;
          logger.trace(
            { domain, key, name, value: incoming },
            `update number attributes (single)`,
          );
          ENTITY_SET_ATTRIBUTE.inc({
            domain: registry.domain,
            name,
          });
          RunCallbacks(current);
        },

        setAttributes(newAttributes: ATTRIBUTES) {
          if (is.equal(entity.attributes, newAttributes)) {
            return;
          }
          entity.attributes = newAttributes;
          logger.trace(
            { id, name: registry.domain, newAttributes },
            `update attributes (all)`,
          );
          RunCallbacks({ attributes: entity.attributes });
        },

        setState(newState: STATE) {
          if (entity.state === newState) {
            return;
          }
          logger.trace(
            { id, name: registry.domain, newState },
            `update sensor state`,
          );
          entity.state = newState;
          RunCallbacks({ state: entity.state });
        },

        state: value.state,
      };
      return entity;
    },
    // #MARK: access methods
    storage: {
      load: [CacheLoader, HassLoader] as ValueLoader[],
      store: [] as unknown[],
    },
  };
}
