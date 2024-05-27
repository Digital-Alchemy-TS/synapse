import { is, TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
  SynapseVirtualWaterHeater,
  SynapseWaterHeaterParams,
  VIRTUAL_ENTITY_BASE_KEYS,
  WaterHeaterConfiguration,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualWaterHeater({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualWaterHeater>({
    context,
    // @ts-expect-error it's fine
    domain: "water_heater",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseWaterHeaterParams) {
    const proxy = new Proxy({} as SynapseVirtualWaterHeater, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualWaterHeater) {
        // > common
        // * name
        if (property === "name") {
          return entity.name;
        }
        // * unique_id
        if (property === "unique_id") {
          return unique_id;
        }
        // * onUpdate
        if (property === "onUpdate") {
          return loader.onUpdate();
        }
        // * _rawConfiguration
        if (property === "_rawConfiguration") {
          return loader.configuration;
        }
        // * _rawAttributes
        if (property === "_rawAttributes") {
          return loader.attributes;
        }
        // * attributes
        if (property === "attributes") {
          return loader.attributesProxy();
        }
        // * configuration
        if (property === "configuration") {
          return loader.configurationProxy();
        }
        // * state
        if (property === "state") {
          return loader.state;
        }
        // > domain specific
        // * onSetTemperature
        if (property === "onSetTemperature") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_TEMPERATURE, callback);
        }
        // * onSetOperationMode
        if (property === "onSetOperationMode") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_OPERATION_MODE, callback);
        }
        // * onTurnAwayModeOn
        if (property === "onTurnAwayModeOn") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_AWAY_MODE_ON, callback);
        }
        // * onTurnAwayModeOff
        if (property === "onTurnAwayModeOff") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_AWAY_MODE_OFF, callback);
        }
        // * onTurnOn
        if (property === "onTurnOn") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_ON, callback);
        }
        // * onTurnOff
        if (property === "onTurnOff") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_OFF, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onSetTemperature",
        "onSetOperationMode",
        "onTurnAwayModeOn",
        "onTurnAwayModeOff",
        "onTurnOn",
        "onTurnOff",
      ],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<
      STATE,
      ATTRIBUTES,
      WaterHeaterConfiguration
    >({
      load_keys: [
        "min_temp",
        "max_temp",
        "current_temperature",
        "target_temperature",
        "target_temperature_high",
        "target_temperature_low",
        "temperature_unit",
        "current_operation",
        "operation_list",
        "supported_features",
        "is_away_mode_on",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const SET_TEMPERATURE = synapse.registry.busTransfer({
      context,
      eventName: "set_temperature",
      unique_id,
    });
    const SET_OPERATION_MODE = synapse.registry.busTransfer({
      context,
      eventName: "set_operation_mode",
      unique_id,
    });
    const TURN_AWAY_MODE_ON = synapse.registry.busTransfer({
      context,
      eventName: "turn_away_mode_on",
      unique_id,
    });
    const TURN_AWAY_MODE_OFF = synapse.registry.busTransfer({
      context,
      eventName: "turn_away_mode_off",
      unique_id,
    });
    const TURN_ON = synapse.registry.busTransfer({
      context,
      eventName: "turn_on",
      unique_id,
    });
    const TURN_OFF = synapse.registry.busTransfer({
      context,
      eventName: "turn_off",
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.set_temperature)) {
      proxy.onSetTemperature(entity.set_temperature);
    }
    if (is.function(entity.set_operation_mode)) {
      proxy.onSetOperationMode(entity.set_operation_mode);
    }
    if (is.function(entity.turn_away_mode_on)) {
      proxy.onTurnAwayModeOn(entity.turn_away_mode_on);
    }
    if (is.function(entity.turn_away_mode_off)) {
      proxy.onTurnAwayModeOff(entity.turn_away_mode_off);
    }
    if (is.function(entity.turn_on)) {
      proxy.onTurnOn(entity.turn_on);
    }
    if (is.function(entity.turn_off)) {
      proxy.onTurnOff(entity.turn_off);
    }

    // - Done
    return proxy;
  };
}
