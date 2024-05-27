import { is, TServiceParams } from "@digital-alchemy/core";

import {
  HumidifierConfiguration,
  isBaseEntityKeys,
  RemovableCallback,
  SynapseHumidifierParams,
  SynapseVirtualHumidifier,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualHumidifier({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualHumidifier>({
    context,
    // @ts-expect-error it's fine
    domain: "humidifier",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseHumidifierParams) {
    const proxy = new Proxy({} as SynapseVirtualHumidifier, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualHumidifier) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onTurnOn",
        "onTurnOff",
        "onSetHumidity",
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
      HumidifierConfiguration
    >({
      load_keys: [
        "action",
        "available_modes",
        "current_humidity",
        "device_class",
        "is_on",
        "max_humidity",
        "min_humidity",
        "mode",
        "target_humidity",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach } = synapse.registry.busTransfer({
      context,
      eventName: ["turn_on", "turn_off", "set_humidity"],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
