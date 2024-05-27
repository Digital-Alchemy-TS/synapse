import { is, TServiceParams } from "@digital-alchemy/core";

import {
  FanConfiguration,
  RemovableCallback,
  SynapseFanParams,
  SynapseVirtualFan,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualFan({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualFan>({
    context,
    // @ts-expect-error it's fine
    domain: "fan",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseFanParams) {
    const proxy = new Proxy({} as SynapseVirtualFan, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualFan) {
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
        // * onStopFanTilt
        if (property === "onSetDirection") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_DIRECTION, callback);
        }
        // * onSetFanTiltPosition
        if (property === "onSetPresetMode") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_PRESET_MODE, callback);
        }
        // * onCloseFanTilt
        if (property === "onSetPercentage") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_PERCENTAGE, callback);
        }
        // * onOpenFanTilt
        if (property === "onTurnOn") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_ON, callback);
        }
        // * onStopFan
        if (property === "onTurnOff") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_OFF, callback);
        }
        // * onSetFanPosition
        if (property === "onToggle") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TOGGLE, callback);
        }
        // * onCloseFan
        if (property === "onOscillate") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(OSCILLATE, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onSetDirection",
        "onSetPresetMode",
        "onSetPercentage",
        "onTurnOn",
        "onTurnOff",
        "onToggle",
        "onOscillate",
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
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, FanConfiguration>(
      {
        load_keys: [
          "current_direction",
          "is_on",
          "oscillating",
          "percentage",
          "preset_mode",
          "preset_modes",
          "speed_count",
        ],
        name: entity.name,
        registry: registry as TRegistry<unknown>,
        unique_id,
      },
    );

    // - Attach bus events
    const [
      SET_DIRECTION,
      SET_PRESET_MODE,
      SET_PERCENTAGE,
      TURN_ON,
      TURN_OFF,
      TOGGLE,
      OSCILLATE,
    ] = synapse.registry.busTransfer({
      context,
      eventName: [
        "set_direction",
        "set_preset_mode",
        "set_percentage",
        "turn_on",
        "turn_off",
        "toggle",
        "oscillate",
      ],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.set_direction)) {
      proxy.onSetDirection(entity.set_direction);
    }
    if (is.function(entity.set_preset_mode)) {
      proxy.onSetPresetMode(entity.set_preset_mode);
    }
    if (is.function(entity.set_percentage)) {
      proxy.onSetPercentage(entity.set_percentage);
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
    if (is.function(entity.oscillate)) {
      proxy.onOscillate(entity.oscillate);
    }

    // - Done
    return proxy;
  };
}
