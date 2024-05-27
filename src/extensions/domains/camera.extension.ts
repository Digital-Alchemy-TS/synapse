import { is, TServiceParams } from "@digital-alchemy/core";

import {
  CameraConfiguration,
  RemovableCallback,
  SynapseCameraParams,
  SynapseVirtualCamera,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

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
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onTurnOn
        if (property === "onTurnOn") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_ON, callback);
        }
        // * onTurnOff
        if (property === "onTurnOff") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_OFF, callback);
        }
        // * onEnableMotionDetection
        if (property === "onEnableMotionDetection") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(
              ENABLE_MOTION_DETECTION,
              callback,
            );
        }
        // * onDisableMotionDetection
        if (property === "onDisableMotionDetection") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(
              DISABLE_MOTION_DETECTION,
              callback,
            );
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onTurnOn",
        "onTurnOff",
        "onEnableMotionDetection",
        "onDisableMotionDetection",
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
    const [
      TURN_ON,
      TURN_OFF,
      ENABLE_MOTION_DETECTION,
      DISABLE_MOTION_DETECTION,
    ] = synapse.registry.busTransfer({
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
    if (is.function(entity.turn_on)) {
      proxy.onTurnOn(entity.turn_on);
    }
    if (is.function(entity.turn_off)) {
      proxy.onTurnOff(entity.turn_off);
    }
    if (is.function(entity.enable_motion_detection)) {
      proxy.onEnableMotionDetection(entity.enable_motion_detection);
    }
    if (is.function(entity.disable_motion_detection)) {
      proxy.onDisableMotionDetection(entity.disable_motion_detection);
    }

    // - Done
    return proxy;
  };
}
