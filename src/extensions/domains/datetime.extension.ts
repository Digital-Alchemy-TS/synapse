import { is, TServiceParams } from "@digital-alchemy/core";
import dayjs, { Dayjs } from "dayjs";

import {
  DateTimeConfiguration,
  isBaseEntityKeys,
  SynapseDateTimeParams,
  SynapseVirtualDateTime,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualDateTime({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualDateTime>({
    context,
    // @ts-expect-error it's fine
    domain: "datetime",
  });

  // #MARK: create
  return function <STATE extends string = string, ATTRIBUTES extends object = object>(
    entity: SynapseDateTimeParams,
  ) {
    const proxy = new Proxy({} as SynapseVirtualDateTime, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualDateTime) {
        if (property === "state") {
          return loader.configuration.native_value;
        }
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
          loader.setConfiguration(
            "native_value",
            is.string(value) ? dayjs(value) : (value as Dayjs),
          );
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
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, DateTimeConfiguration>({
      load_keys: ["native_value"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: ["set_value"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    if (entity.managed !== false) {
      proxy.onSetValue(({ value }) => (proxy.configuration.native_value = dayjs(value)));
    }

    // - Done
    return proxy;
  };
}
