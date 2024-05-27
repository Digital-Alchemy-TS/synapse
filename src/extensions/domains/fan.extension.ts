import { TServiceParams } from "@digital-alchemy/core";

import {
  FanConfiguration,
  SynapseFanParams,
  SynapseVirtualFan,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

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
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
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
    const { dynamicAttach, staticAttach } = synapse.registry.busTransfer({
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
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
