import { is, TServiceParams } from "@digital-alchemy/core";

import {
  MediaPlayerConfiguration,
  RemovableCallback,
  SynapseMediaPlayerParams,
  SynapseVirtualMediaPlayer,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualMediaPlayer({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualMediaPlayer>({
    context,
    // @ts-expect-error it's fine
    domain: "cover",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseMediaPlayerParams) {
    const proxy = new Proxy({} as SynapseVirtualMediaPlayer, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualMediaPlayer) {
        // > common
        // * name
        if (property === "name") {
          return entity.name;
        }
        // * unique_id
        if (property === "unique_id") {
          return unique_id;
        }
        // * onUpdate
        if (property === "onUpdate") {
          return loader.onUpdate();
        }
        // * _rawConfiguration
        if (property === "_rawConfiguration") {
          return loader.configuration;
        }
        // * _rawAttributes
        if (property === "_rawAttributes") {
          return loader.attributes;
        }
        // * attributes
        if (property === "attributes") {
          return loader.attributesProxy();
        }
        // * configuration
        if (property === "configuration") {
          return loader.configurationProxy();
        }
        // * state
        if (property === "state") {
          return loader.state;
        }
        // > domain specific
        // * onPlayMedia
        if (property === "onPlayMedia") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(PLAY_MEDIA, callback);
        }
        // * onSelectSoundMode
        if (property === "onSelectSoundMode") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SELECT_SOUND_MODE, callback);
        }
        // * onSelectSource
        if (property === "onSelectSource") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(SELECT_SOURCE, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onPlayMedia",
        "onSelectSoundMode",
        "onSelectSource",
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
      MediaPlayerConfiguration
    >({
      load_keys: [
        "app_id",
        "app_name",
        "device_class",
        "group_members",
        "is_volume_muted",
        "media_album_artist",
        "media_album_name",
        "media_artist",
        "media_channel",
        "media_content_id",
        "media_content_type",
        "media_duration",
        "media_episode",
        "media_image_hash",
        "media_image_remotely_accessible",
        "media_image_url",
        "media_playlist",
        "media_position",
        "media_position_updated_at",
        "media_season",
        "media_series_title",
        "media_title",
        "media_track",
        "repeat",
        "shuffle",
        "sound_mode",
        "sound_mode_list",
        "source",
        "source_list",
        "supported_features",
        "volume_level",
        "volume_step",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const PLAY_MEDIA = synapse.registry.busTransfer({
      context,
      eventName: "play_media",
      unique_id,
    });

    const SELECT_SOUND_MODE = synapse.registry.busTransfer({
      context,
      eventName: "select_sound_mode",
      unique_id,
    });

    const SELECT_SOURCE = synapse.registry.busTransfer({
      context,
      eventName: "select_source",
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.play_media)) {
      proxy.onPlayMedia(entity.play_media);
    }
    if (is.function(entity.select_sound_mode)) {
      proxy.onSelectSoundMode(entity.select_sound_mode);
    }
    if (is.function(entity.select_source)) {
      proxy.onSelectSource(entity.select_source);
    }

    // - Done
    return proxy;
  };
}
