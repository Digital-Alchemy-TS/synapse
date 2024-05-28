import { TServiceParams } from "@digital-alchemy/core";

import {
  CameraConfiguration,
  isBaseEntityKeys,
  SynapseCameraParams,
  SynapseVirtualCamera,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";

export function VirtualCamera({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualCamera>({
    context,
    // @ts-expect-error it's fine
    domain: "fan",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseCameraParams) {
    const proxy = new Proxy({} as SynapseVirtualCamera, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualCamera) {
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
      CameraConfiguration
    >({
      load_keys: [
        "brand",
        "frame_interval",
        "frontend_stream_type",
        "is_on",
        "is_recording",
        "is_streaming",
        "model",
        "motion_detection_enabled",
        "use_stream_for_stills",
        "supported_features",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach, keys } = synapse.registry.busTransfer({
      context,
      eventName: [
        "turn_on",
        "turn_off",
        "enable_motion_detection",
        "disable_motion_detection",
      ],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
