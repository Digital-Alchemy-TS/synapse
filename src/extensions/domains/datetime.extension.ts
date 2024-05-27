import { is, TServiceParams } from "@digital-alchemy/core";

import {
  DateTimeConfiguration,
  RemovableCallback,
  SynapseDateTimeParams,
  SynapseVirtualDateTime,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

export function VirtualDateTime({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualDateTime>({
    context,
    // @ts-expect-error it's fine
    domain: "datetime",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseDateTimeParams) {
    const proxy = new Proxy({} as SynapseVirtualDateTime, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualDateTime) {
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onActivate
        if (property === "onSetValue") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_VALUE, callback);
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
      DateTimeConfiguration
    >({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [SET_VALUE] = synapse.registry.busTransfer({
      context,
      eventName: ["set_value"],
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.set_value)) {
      proxy.onSetValue(entity.set_value);
    }

    if (entity.managed !== false) {
      proxy.onSetValue(({ value }) => (proxy.state = value));
    }

    // - Done
    return proxy;
  };
}
