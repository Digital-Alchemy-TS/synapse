import { is, TServiceParams } from "@digital-alchemy/core";

import {
  LawnMowerConfiguration,
  RemovableCallback,
  SynapseLawnMowerParams,
  SynapseVirtualLawnMower,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

export function VirtualLawnMower({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualLawnMower>({
    context,
    // @ts-expect-error it's fine
    domain: "lawn_mower",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseLawnMowerParams) {
    const proxy = new Proxy({} as SynapseVirtualLawnMower, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualLawnMower) {
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onStartMowing
        if (property === "onStartMowing") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(START_MOWING, callback);
        }
        // * onDock
        if (property === "onDock") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(DOCK, callback);
        }
        // * onPause
        if (property === "onPause") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(PAUSE, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onStartMowing",
        "onDock",
        "onPause",
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
      LawnMowerConfiguration
    >({
      load_keys: ["activity", "supported_features"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [START_MOWING, DOCK, PAUSE] = synapse.registry.busTransfer({
      context,
      eventName: ["start_mowing", "dock", "pause"],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.start_mowing)) {
      proxy.onStartMowing(entity.start_mowing);
    }
    if (is.function(entity.dock)) {
      proxy.onDock(entity.dock);
    }
    if (is.function(entity.pause)) {
      proxy.onPause(entity.pause);
    }

    // - Done
    return proxy;
  };
}
