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
  unique_id: TSynapseId;
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
    unique_id: unique_id,
    name,
    value,
  }: LoaderOptions<STATE, ATTRIBUTES, CONFIGURATION>) {
    const domain = registry.domain;

    // #MARK: value load
    lifecycle.onBootstrap(async () => {
      await each(registry.list(), async (unique_id: TSynapseId) => {
        const cache =
          await registry.getCache<ReturnType<typeof currentState>>(unique_id);
        if (!is.empty(cache)) {
          entity.state = cache.state;
          entity.attributes = cache.attributes;
          entity.configuration = cache.configuration;
          return;
        }

        const config = hass.entity.registry.current.find(
          i => i.unique_id === unique_id,
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
        const current = currentState();
        await registry.setCache(unique_id, current);
        await registry.send(unique_id, current);
      });
    }

    const entity = {
      attributes: value.attributes,
      configuration: value.configuration,

      /**
       * Does not trigger on configuration changes, only state / attributes
       */
      // #MARK: onUpdate
      onUpdate() {
        return (callback: TCallback) => {
          let remover: { remove: () => TBlackHole };
          lifecycle.onReady(() => {
            remover = hass.entity
              .byUniqueId(unique_id)
              ?.onUpdate(
                async (new_state, old_state, remove) =>
                  await callback(new_state, old_state, remove),
              );
            if (remover) {
              logger.warn(
                {
                  // hopefully this provides enough context?
                  configuration: entity.configuration,
                  name: "onUpdate",
                  unique_id,
                },
                `update attachment failed, is entity loaded in home assistant?`,
              );
            }
          });
          return {
            remove() {
              if (remover) {
                logger.trace(`removing entity update callback`);
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
          { name: registry.domain, newAttributes, unique_id },
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
          { name: registry.domain, newConfiguration, unique_id },
          `update configuration (all)`,
        );
        runCallbacks();
      },

      // #MARK: setState
      setState(new_state: STATE) {
        if (entity.state === new_state) {
          return;
        }
        const old_state = entity.state;
        logger.trace(
          { name: registry.domain, new_state, old_state, unique_id },
          `update state`,
        );
        entity.state = new_state;
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
