import { is, TServiceParams } from "@digital-alchemy/core";

import {
  ClimateConfiguration,
  RemovableCallback,
  SynapseClimateParams,
  SynapseVirtualClimate,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualClimate({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualClimate>({
    context,
    // @ts-expect-error it's fine
    domain: "climate",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseClimateParams) {
    const proxy = new Proxy({} as SynapseVirtualClimate, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualClimate) {
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
        // * onSetHvacMode
        if (property === "onSetHvacMode") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_HVAC_MODE, callback);
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
        // * onToggle
        if (property === "onToggle") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TOGGLE, callback);
        }
        // * onSetPresetMode
        if (property === "onSetPresetMode") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_PRESET_MODE, callback);
        }
        // * onSetFanMode
        if (property === "onSetFanMode") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_FAN_MODE, callback);
        }
        // * onSetHumidity
        if (property === "onSetHumidity") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_HUMIDITY, callback);
        }
        // * onSetSwingMode
        if (property === "onSetSwingMode") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_SWING_MODE, callback);
        }
        // * onSetTemperature
        if (property === "onSetTemperature") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_TEMPERATURE, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onSetHvacMode",
        "onTurnOn",
        "onTurnOff",
        "onToggle",
        "onSetPresetMode",
        "onSetFanMode",
        "onSetHumidity",
        "onSetSwingMode",
        "onSetTemperature",
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
      ClimateConfiguration
    >({
      load_keys: [
        "current_humidity",
        "current_temperature",
        "fan_mode",
        "fan_modes",
        "hvac_action",
        "hvac_mode",
        "hvac_modes",
        "max_humidity",
        "max_temp",
        "min_humidity",
        "min_temp",
        "precision",
        "preset_mode",
        "preset_modes",
        "swing_mode",
        "swing_modes",
        "target_humidity",
        "target_temperature_high",
        "target_temperature_low",
        "target_temperature_step",
        "target_temperature",
        "temperature_unit",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const SET_HVAC_MODE = synapse.registry.busTransfer({
      context,
      eventName: "set_hvac_mode",
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
    const TOGGLE = synapse.registry.busTransfer({
      context,
      eventName: "toggle",
      unique_id,
    });
    const SET_PRESET_MODE = synapse.registry.busTransfer({
      context,
      eventName: "set_preset_mode",
      unique_id,
    });
    const SET_FAN_MODE = synapse.registry.busTransfer({
      context,
      eventName: "set_fan_mode",
      unique_id,
    });
    const SET_HUMIDITY = synapse.registry.busTransfer({
      context,
      eventName: "set_humidity",
      unique_id,
    });
    const SET_SWING_MODE = synapse.registry.busTransfer({
      context,
      eventName: "set_swing_mode",
      unique_id,
    });
    const SET_TEMPERATURE = synapse.registry.busTransfer({
      context,
      eventName: "set_temperature",
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.set_hvac_mode)) {
      proxy.onSetHvacMode(entity.set_hvac_mode);
    }
    if (is.function(entity.turn_on)) {
      proxy.onTurnOn(entity.turn_on);
    }
    if (is.function(entity.turn_off)) {
      proxy.onTurnOff(entity.turn_off);
    }
    if (is.function(entity.toggle)) {
      proxy.onToggle(entity.toggle);
    }
    if (is.function(entity.set_preset_mode)) {
      proxy.onSetPresetMode(entity.set_preset_mode);
    }
    if (is.function(entity.set_fan_mode)) {
      proxy.onSetFanMode(entity.set_fan_mode);
    }
    if (is.function(entity.set_humidity)) {
      proxy.onSetHumidity(entity.set_humidity);
    }
    if (is.function(entity.set_swing_mode)) {
      proxy.onSetSwingMode(entity.set_swing_mode);
    }
    if (is.function(entity.set_temperature)) {
      proxy.onSetTemperature(entity.set_temperature);
    }
    // - Done
    return proxy;
  };
}
