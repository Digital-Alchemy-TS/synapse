import { TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
  SynapseValveParams,
  SynapseVirtualValve,
  ValveConfiguration,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualValve({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualValve>({
    context,
    // @ts-expect-error it's fine
    domain: "valve",
  });

  // #MARK: create
  return function <STATE extends string = string, ATTRIBUTES extends object = object>(
    entity: SynapseValveParams,
  ) {
    const proxy = new Proxy({} as SynapseVirtualValve, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualValve) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, ...keys],

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
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, ValveConfiguration>({
      load_keys: [
        "current_valve_position",
        "is_closed",
        "is_opening",
        "reports_position",
        "device_class",
        "is_closing",
        "supported_features",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["open_valve", "close_valve", "set_valve_position", "stop_valve"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
