import { is, TServiceParams } from "@digital-alchemy/core";

import {
  LawnMowerConfiguration,
  RemovableCallback,
  SynapseLawnMowerParams,
  SynapseVirtualLawnMower,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

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

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onSetValue"],

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
    const START_MOWING = synapse.registry.busTransfer({
      context,
      eventName: "start_mowing",
      unique_id,
    });
    const DOCK = synapse.registry.busTransfer({
      context,
      eventName: "dock",
      unique_id,
    });
    const PAUSE = synapse.registry.busTransfer({
      context,
      eventName: "pause",
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
