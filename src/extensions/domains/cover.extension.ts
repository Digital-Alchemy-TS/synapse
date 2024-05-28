import { TServiceParams } from "@digital-alchemy/core";

import {
  CoverConfiguration,
  isBaseEntityKeys,
  SynapseCoverParams,
  SynapseVirtualCover,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualCover({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualCover>({
    context,
    // @ts-expect-error it's fine
    domain: "cover",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseCoverParams) {
    const proxy = new Proxy({} as SynapseVirtualCover, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualCover) {
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
    const loader = synapse.storage.wrapper<
      STATE,
      ATTRIBUTES,
      CoverConfiguration
    >({
      load_keys: [
        "current_cover_position",
        "current_cover_tilt_position",
        "device_class",
        "is_closed",
        "is_closing",
        "is_opening",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: [
        "stop_cover_tilt",
        "set_cover_tilt_position",
        "close_cover_tilt",
        "open_cover_tilt",
        "stop_cover",
        "set_cover_position",
        "close_cover",
        "open_cover",
      ],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
