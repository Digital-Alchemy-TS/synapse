import {
  each,
  is,
  REDIS_ERROR_COUNT,
  SECOND,
  TBlackHole,
  TServiceParams,
} from "@digital-alchemy/core";
import { domain, ENTITY_STATE, PICK_ENTITY, TRawDomains } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, BaseEntityKeys, BaseEntityParams, TSynapseId } from "..";
import { TRegistry } from ".";

type LoaderOptions<CONFIGURATION extends object> = {
  registry: TRegistry<unknown>;
  unique_id: TSynapseId;
  name: string;
  load_keys?: (keyof CONFIGURATION)[];
  config_defaults?: Partial<CONFIGURATION>;
  restore?: (keyof CONFIGURATION)[];
};

type TCallback = (
  new_state: NonNullable<ENTITY_STATE<PICK_ENTITY>>,
  old_state: NonNullable<ENTITY_STATE<PICK_ENTITY>>,
  remove: () => TBlackHole,
) => TBlackHole;

const LATE_READY = -1;
const STATELESS = new Set(["scene", "button"] as TRawDomains[]);

export function ValueStorage({ logger, lifecycle, hass, synapse }: TServiceParams) {
  // #MARK: wrapper
  function wrapper<STATE, ATTRIBUTES extends object, CONFIGURATION extends object = object>({
    registry,
    unique_id,
    name,
    load_keys = [],
    config_defaults,
    restore = [],
  }: LoaderOptions<CONFIGURATION>) {
    const registryDomain = registry.domain;

    // #MARK: value load
    lifecycle.onReady(async () => {
      await each(registry.list(), async (unique_id: TSynapseId) => {
        const config = hass.entity.registry.current.find(i => i.unique_id === unique_id);
        if (!config) {
          logger.warn(
            { entity: registry.rawConfigById(unique_id) },
            "cannot find entity in hass registry",
          );
          return;
        }
        const entity_id = config.entity_id;
        const reference = hass.entity.byId(entity_id);
        if (STATELESS.has(domain(entity_id))) {
          return;
        }
        if (reference.state === "unavailable") {
          logger.trace({ name: entity_id, state: reference.state }, `waiting for initial value`);
          await reference.nextState();
          logger.trace({ name: entity_id }, "received");
        }
        const proxy = synapse.registry.byId(unique_id);
        restore.forEach(key => {
          const value = reference.attributes[
            key as keyof typeof reference.attributes
          ] as CONFIGURATION[keyof CONFIGURATION];
          if (is.undefined(value)) {
            return;
          }
          (proxy.configuration as CONFIGURATION)[key] = value;
        });
        const value = reference.state as STATE;
        logger.error("[%s] - {%s}", entity_id, value);
        proxy.state = value;
        // entity.attributes = { ...reference.attributes } as ATTRIBUTES;
        logger.warn({ imported: proxy.state, name: entity_id, value }, `state import`);
      });
    }, LATE_READY);

    const currentState = () => ({
      attributes: entity.attributes,
      configuration: entity.configuration,
      last_reported: new Date().toISOString(),
      state: entity.state,
    });

    // #MARK: RunCallbacks
    function runCallbacks(send = true) {
      setImmediate(async () => {
        const current = currentState();
        await registry.setCache(unique_id, current);
        if (send) {
          await registry.send(unique_id, current);
        }
      });
    }

    lifecycle.onReady(async () => await runCallbacks(false));

    const value = registry.rawConfigById(unique_id) as BaseEntityParams<STATE, ATTRIBUTES>;
    value.defaultAttributes ??= {} as ATTRIBUTES;
    const valueConfig = { ...value, ...config_defaults };
    const keys = [...BASE_CONFIG_KEYS, ...load_keys] as (keyof typeof valueConfig)[];

    const defaultConfiguration = Object.fromEntries(
      keys.map(i => [i, valueConfig[i]]),
    ) as CONFIGURATION;

    const entity = {
      attributes: value.defaultAttributes,

      attributesProxy() {
        return new Proxy({} as ATTRIBUTES, {
          get: <KEY extends Extract<keyof ATTRIBUTES, string>>(_: ATTRIBUTES, property: KEY) => {
            return entity.attributes[property];
          },
          set: <KEY extends Extract<keyof ATTRIBUTES, string>, VALUE extends ATTRIBUTES[KEY]>(
            _: ATTRIBUTES,
            property: KEY,
            value: VALUE,
          ) => {
            entity.setAttribute(property, value);
            return true;
          },
        });
      },

      baseGet(keys: BaseEntityKeys) {
        switch (keys) {
          case "name": {
            return name;
          }
          case "unique_id": {
            return unique_id;
          }
          case "onUpdate": {
            return entity.onUpdate();
          }
          case "_rawAttributes": {
            return entity.attributes;
          }
          case "_rawConfiguration": {
            return entity.configuration;
          }
          case "attributes": {
            return entity.attributesProxy();
          }
          case "configuration": {
            return entity.configurationProxy();
          }
          case "state": {
            return entity.state;
          }
        }
      },

      configuration: defaultConfiguration,

      configurationProxy() {
        return new Proxy({} as CONFIGURATION, {
          get: <KEY extends Extract<keyof CONFIGURATION, string>>(
            _: CONFIGURATION,
            property: KEY,
          ) => {
            return entity.configuration[property];
          },
          set: <KEY extends Extract<keyof CONFIGURATION, string>, VALUE extends CONFIGURATION[KEY]>(
            _: CONFIGURATION,
            property: KEY,
            value: VALUE,
          ) => {
            entity.setConfiguration(property, value);
            return true;
          },
        });
      },

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
          }, LATE_READY);
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
        entity.attributes[key] = incoming;
        logger.trace(
          { domain: registryDomain, key, name, value: incoming },
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
      setConfiguration<KEY extends keyof CONFIGURATION, VALUE extends CONFIGURATION[KEY]>(
        key: KEY,
        incoming: VALUE,
      ) {
        if (is.equal(entity.configuration[key], incoming)) {
          return;
        }
        entity.configuration[key] = incoming;
        logger.trace(
          { domain: registryDomain, key, name, value: incoming },
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
        logger.trace({ name: registry.domain, new_state, old_state, unique_id }, `update state`);
        entity.state = new_state;
        runCallbacks();
      },

      state: value.defaultState,
    };
    return entity;
  }

  // #MARK: return
  return {
    wrapper,
  };
}
