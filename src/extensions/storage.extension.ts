import { each, is, TBlackHole, TServiceParams } from "@digital-alchemy/core";
import { ENTITY_STATE, PICK_ENTITY } from "@digital-alchemy/hass";

import { TSynapseId } from "..";
import { TRegistry } from ".";

type StorageData<STATE, ATTRIBUTES, CONFIGURATION> = {
  attributes?: ATTRIBUTES;
  configuration?: CONFIGURATION;
  state?: STATE;
  last_reported?: string;
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

type TCallback = (
  new_state: NonNullable<ENTITY_STATE<PICK_ENTITY>>,
  old_state: NonNullable<ENTITY_STATE<PICK_ENTITY>>,
  remove: () => TBlackHole,
) => TBlackHole;

export function ValueStorage({ logger, lifecycle, hass }: TServiceParams) {
  // #MARK: wrapper
  function wrapper<
    STATE,
    ATTRIBUTES extends object,
    CONFIGURATION extends object = object,
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

    const currentState = () => ({
      attributes: entity.attributes,
      configuration: entity.configuration,
      last_reported: new Date().toISOString(),
      state: entity.state,
    });

    // #MARK: RunCallbacks
    function runCallbacks() {
      setImmediate(async () => {
        await registry.setCache(id, currentState());
        const current = currentState();
        await registry.send(id, current);
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
        return (callback: TCallback) => {
          let remover: { remove: () => TBlackHole };
          lifecycle.onReady(() => {
            const registry = hass.entity.registry.current.find(
              i => i.unique_id === id,
            );
            if (!registry) {
              return;
            }
            remover = hass.entity
              .byId(registry.entity_id)
              .onUpdate(
                async (new_state, old_state, remove) =>
                  await callback(new_state, old_state, remove),
              );
          });
          return {
            remove() {
              if (remover) {
                remover.remove();
                remover = undefined;
                return;
              }
              // too soon / already used
              logger.error(`no remover function defined`);
            },
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
        value.attributes[key] = incoming;
        logger.trace(
          { domain, key, name, value: incoming },
          `update attribute (single)`,
        );
        runCallbacks();
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
        runCallbacks();
      },

      // #MARK: setAttribute
      setConfiguration<
        KEY extends keyof CONFIGURATION,
        VALUE extends CONFIGURATION[KEY],
      >(key: KEY, incoming: VALUE) {
        if (is.equal(entity.configuration[key], incoming)) {
          return;
        }
        value.configuration[key] = incoming;
        logger.trace(
          { domain, key, name, value: incoming },
          `update configuration (single)`,
        );
        runCallbacks();
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
        runCallbacks();
      },

      // #MARK: setState
      setState(newState: STATE) {
        if (entity.state === newState) {
          return;
        }
        logger.trace({ id, name: registry.domain, newState }, `update state`);
        entity.state = newState;
        runCallbacks();
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
