import { is, TServiceParams } from "@digital-alchemy/core";

import {
  CoverConfiguration,
  RemovableCallback,
  SynapseCoverParams,
  SynapseVirtualCover,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

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
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onStopCoverTilt
        if (property === "onStopCoverTilt") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(STOP_COVER_TILT, callback);
        }
        // * onSetCoverTiltPosition
        if (property === "onSetCoverTiltPosition") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(
              SET_COVER_TILT_POSITION,
              callback,
            );
        }
        // * onCloseCoverTilt
        if (property === "onCloseCoverTilt") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(CLOSE_COVER_TILT, callback);
        }
        // * onOpenCoverTilt
        if (property === "onOpenCoverTilt") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(OPEN_COVER_TILT, callback);
        }
        // * onStopCover
        if (property === "onStopCover") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(STOP_COVER, callback);
        }
        // * onSetCoverPosition
        if (property === "onSetCoverPosition") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SET_COVER_POSITION, callback);
        }
        // * onCloseCover
        if (property === "onCloseCover") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(CLOSE_COVER, callback);
        }
        // * onOpenCover
        if (property === "onOpenCover") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(OPEN_COVER, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onStopCoverTilt",
        "onSetCoverTiltPosition",
        "onCloseCoverTilt",
        "onOpenCoverTilt",
        "onStopCover",
        "onSetCoverPosition",
        "onCloseCover",
        "onOpenCover",
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
    const [
      STOP_COVER_TILT,
      SET_COVER_TILT_POSITION,
      CLOSE_COVER_TILT,
      OPEN_COVER_TILT,
      STOP_COVER,
      SET_COVER_POSITION,
      CLOSE_COVER,
      OPEN_COVER,
    ] = synapse.registry.busTransfer({
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
    if (is.function(entity.stop_cover_tilt)) {
      proxy.onStopCoverTilt(entity.stop_cover_tilt);
    }
    if (is.function(entity.set_cover_tilt_position)) {
      proxy.onSetCoverTiltPosition(entity.set_cover_tilt_position);
    }
    if (is.function(entity.close_cover_tilt)) {
      proxy.onCloseCoverTilt(entity.close_cover_tilt);
    }
    if (is.function(entity.open_cover_tilt)) {
      proxy.onOpenCoverTilt(entity.open_cover_tilt);
    }
    if (is.function(entity.stop_cover)) {
      proxy.onStopCover(entity.stop_cover);
    }
    if (is.function(entity.set_cover_position)) {
      proxy.onSetCoverPosition(entity.set_cover_position);
    }
    if (is.function(entity.close_cover)) {
      proxy.onCloseCover(entity.close_cover);
    }
    if (is.function(entity.close_cover)) {
      proxy.onOpenCover(entity.open_cover);
    }

    // - Done
    return proxy;
  };
}
