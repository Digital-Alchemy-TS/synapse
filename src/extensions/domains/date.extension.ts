import { is, TServiceParams } from "@digital-alchemy/core";
import dayjs, { Dayjs } from "dayjs";

import {
  DateConfiguration,
  isBaseEntityKeys,
  SynapseDateFormat,
  SynapseDateParams,
  SynapseVirtualDate,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualDate({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualDate>({
    context,
    // @ts-expect-error it's fine
    domain: "date",
  });

  // #MARK: create
  return function <STATE extends string = string, ATTRIBUTES extends object = object>(
    entity: SynapseDateParams,
  ) {
    const proxy = new Proxy({} as SynapseVirtualDate, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualDate) {
        if (property === "state") {
          return dayjs(loader.configuration.native_value, "YYYY-MM-DD");
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
            (is.string(value) ? value : (value as Dayjs).format("YYYY-MM-DD")) as SynapseDateFormat,
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
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, DateConfiguration>({
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
      proxy.onSetValue(({ value }) => (proxy.configuration.native_value = value));
    }

    // - Done
    return proxy;
  };
}
