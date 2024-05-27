import { TServiceParams } from "@digital-alchemy/core";

import {
  SynapseVacuumParams,
  SynapseVirtualVacuum,
  VacuumConfiguration,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

export function VirtualVacuum({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualVacuum>({
    context,
    // @ts-expect-error it's fine
    domain: "lawn_mower",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseVacuumParams) {
    const proxy = new Proxy({} as SynapseVirtualVacuum, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualVacuum) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onCleanSpot",
        "onLocate",
        "onPause",
        "onReturnToBase",
        "onSendCommand",
        "onSetFanSpeed",
        "onStart",
        "onStop",
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
      VacuumConfiguration
    >({
      load_keys: [
        "battery_level",
        "fan_speed",
        "fan_speed_list",
        "supported_features",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach } = synapse.registry.busTransfer({
      context,
      eventName: [
        "clean_spot",
        "locate",
        "pause",
        "return_to_base",
        "send_command",
        "set_fan_speed",
        "start",
        "stop",
      ],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
