import { is, TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
  SirenConfiguration,
  SynapseSirenParams,
  SynapseVirtualSiren,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

export function VirtualSiren({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualSiren>({
    context,
    // @ts-expect-error it's fine
    domain: "valve",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseSirenParams) {
    const proxy = new Proxy({} as SynapseVirtualSiren, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualSiren) {
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onTurnOff
        if (property === "onTurnOff") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_OFF, callback);
        }
        // * onTurnOn
        if (property === "onTurnOn") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_ON, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onTurnOff", "onTurnOn"],

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
      SirenConfiguration
    >({
      load_keys: ["is_on", "available_tones", "supported_features"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [TURN_OFF, TURN_ON] = synapse.registry.busTransfer({
      context,
      eventName: ["turn_off", "turn_on"],
      unique_id,
    });

    // - Attach static listener
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
