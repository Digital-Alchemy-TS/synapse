import {
  deepExtend,
  each,
  is,
  NOT_FOUND,
  TBlackHole,
  TServiceParams,
} from "@digital-alchemy/core";

import { TSynapseId } from "..";
import { TRegistry } from ".";

type StorageData<STATE, ATTRIBUTES, CONFIGURATION> = {
  attributes?: ATTRIBUTES;
  configuration?: CONFIGURATION;
  state?: STATE;
};
type LoaderOptions<
  STATE,
  ATTRIBUTES extends object,
  CONFIGURATION extends object,
> = {
  registry: TRegistry<unknown>;
  id: TSynapseId;
  name: string;
  value: StorageData<STATE, ATTRIBUTES, CONFIGURATION>;
};

type TCallback<
  STATE,
  ATTRIBUTES extends object,
  CONFIGURATION extends object,
> = (
  new_state: StorageData<STATE, ATTRIBUTES, CONFIGURATION>,
  old_state: StorageData<STATE, ATTRIBUTES, CONFIGURATION>,
  remove: () => TBlackHole,
) => TBlackHole;

export function ValueStorage({
  logger,
  lifecycle,
  internal,
  hass,
}: TServiceParams) {
  // #MARK: wrapper
  function wrapper<
    STATE,
    ATTRIBUTES extends object,
    CONFIGURATION extends object,
  >({
    registry,
    id,
    name,
    value,
  }: LoaderOptions<STATE, ATTRIBUTES, CONFIGURATION>) {
    const domain = registry.domain;

    // #MARK: value load
    lifecycle.onBootstrap(async () => {
      await each(registry.list(), async (id: TSynapseId) => {
        const cache =
          await registry.getCache<ReturnType<typeof currentState>>(id);
        if (!is.empty(cache)) {
          entity.state = cache.state;
          entity.attributes = cache.attributes;
          entity.configuration = cache.configuration;
          return;
        }

        const config = hass.entity.registry.current.find(
          i => i.unique_id === id,
        );
        if (!config) {
          logger.warn("cannot find entity in hass registry");
          return;
        }
        const reference = hass.entity.byId(config.entity_id);
        entity.state = reference.state as STATE;
        entity.attributes = { ...reference.attributes } as ATTRIBUTES;
        logger.debug(
          { attributes: entity.attributes, state: entity.state },
          `loading from hass`,
        );
      });
    });

    // #MARK: store
    async function store() {
      await registry.setCache(id, currentState());
    }

    const currentState = () => ({
      attributes: entity.attributes,
      configuration: entity.configuration,
      state: entity.state,
    });

    const callbacks = [] as TCallback<STATE, ATTRIBUTES, CONFIGURATION>[];

    // #MARK: RunCallbacks
    function runCallbacks(
      old_value: StorageData<STATE, ATTRIBUTES, CONFIGURATION>,
    ) {
      setImmediate(async () => {
        await store();
        const current = currentState();
        await registry.send(id, current);
        await each(
          callbacks,
          async callback =>
            await internal.safeExec(async () => {
              const new_value = current;
              await callback(new_value, old_value, function remove() {
                const index = callbacks.indexOf(callback);
                if (index !== NOT_FOUND) {
                  callbacks.splice(callbacks.indexOf(callback));
                }
              });
            }),
        );
      });
    }

    const entity = {
      attributes: value.attributes,
      configuration: value.configuration,

      // #MARK: onUpdate
      /**
       * Does not trigger on configuration changes, only state / attributes
       */
      onUpdate() {
        return (callback: TCallback<STATE, ATTRIBUTES, CONFIGURATION>) => {
          callbacks.push(callback);
          return function remove() {
            const index = callbacks.indexOf(callback);
            if (index !== NOT_FOUND) {
              callbacks.splice(callbacks.indexOf(callback));
            }
          };
        };
      },

      // #MARK: setAttribute
      setAttribute<KEY extends keyof ATTRIBUTES, VALUE extends ATTRIBUTES[KEY]>(
        key: KEY,
        incoming: VALUE,
      ) {
        if (is.equal(entity.attributes[key], incoming)) {
          return;
        }
        const current = deepExtend({}, currentState());
        value.attributes[key] = incoming;
        logger.trace(
          { domain, key, name, value: incoming },
          `update attribute (single)`,
        );
        runCallbacks(current);
      },

      // #MARK: setAttributes
      setAttributes(newAttributes: ATTRIBUTES) {
        if (is.equal(entity.attributes, newAttributes)) {
          return;
        }
        entity.attributes = newAttributes;
        logger.trace(
          { id, name: registry.domain, newAttributes },
          `update attributes (all)`,
        );
        runCallbacks({ attributes: entity.attributes });
      },

      // #MARK: setAttribute
      setConfiguration<
        KEY extends keyof CONFIGURATION,
        VALUE extends CONFIGURATION[KEY],
      >(key: KEY, incoming: VALUE) {
        if (is.equal(entity.configuration[key], incoming)) {
          return;
        }
        const current = deepExtend({}, currentState());
        value.configuration[key] = incoming;
        logger.trace(
          { domain, key, name, value: incoming },
          `update configuration (single)`,
        );
        runCallbacks(current);
      },

      // #MARK: setConfiguration
      setConfigurations(newConfiguration: CONFIGURATION) {
        if (is.equal(entity.configuration, newConfiguration)) {
          return;
        }
        entity.configuration = newConfiguration;
        logger.trace(
          { id, name: registry.domain, newConfiguration },
          `update configuration (all)`,
        );
        runCallbacks({ configuration: entity.configuration });
      },

      // #MARK: setState
      setState(newState: STATE) {
        if (entity.state === newState) {
          return;
        }
        logger.trace({ id, name: registry.domain, newState }, `update state`);
        entity.state = newState;
        runCallbacks({ state: entity.state });
      },

      state: value.state,
    };
    return entity;
  }

  // #MARK: return
  return {
    wrapper,
  };
}
