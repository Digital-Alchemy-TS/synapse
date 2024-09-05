import { TServiceParams } from "@digital-alchemy/core";
import { Dayjs } from "dayjs";

import { AddEntityOptions, SettableConfiguration } from "../..";

enum MediaType {
  MUSIC = "music",
  TVSHOW = "tvshow",
  MOVIE = "movie",
  VIDEO = "video",
  EPISODE = "episode",
  CHANNEL = "channel",
  PLAYLIST = "playlist",
  IMAGE = "image",
  URL = "url",
  GAME = "game",
  APP = "app",
}

enum MediaDeviceClass {
  TV = "tv",
  SPEAKER = "speaker",
  RECEIVER = "receiver",
}

type MediaPlayerEnqueue = "add" | "next" | "play" | "replace";

export type MediaPlayerConfiguration<
  SOURCES extends string = string,
  SOUND_MODES extends string = string,
> = {
  /**
   * ID of the current running app.
   */
  app_id?: SettableConfiguration<string>;
  /**
   * Name of the current running app.
   */
  app_name?: SettableConfiguration<string>;
  /**
   * Type of media player.
   */
  device_class?: `${MediaDeviceClass}`;
  /**
   * A dynamic list of player entities which are currently grouped together for synchronous playback.
   * If the platform has a concept of defining a group leader, the leader should be the first element in that list.
   */
  group_members?: SettableConfiguration<string[]>;
  /**
   * True if if volume is currently muted.
   */
  is_volume_muted?: SettableConfiguration<boolean>;
  /**
   * Album artist of current playing media, music track only.
   */
  media_album_artist?: SettableConfiguration<string>;
  /**
   * Album name of current playing media, music track only.
   */
  media_album_name?: SettableConfiguration<string>;
  /**
   * Album artist of current playing media, music track only.
   */
  media_artist?: SettableConfiguration<string>;
  /**
   * Channel currently playing.
   */
  media_channel?: SettableConfiguration<string>;
  /**
   * Content ID of current playing media.
   */
  media_content_id?: SettableConfiguration<string>;
  /**
   * Content type of current playing media.
   */
  media_content_type?: SettableConfiguration<`${MediaType}`>;
  /**
   * Duration of current playing media in seconds.
   */
  media_duration?: SettableConfiguration<number>;
  /**
   * Episode of current playing media, TV show only.
   */
  media_episode?: SettableConfiguration<string>;
  /**
   * Hash of media image, defaults to SHA256 of media_image_url if media_image_url is not None.
   */
  media_image_hash?: SettableConfiguration<string>;
  /**
   * True if property media_image_url is accessible outside of the home network.
   */
  media_image_remotely_accessible?: SettableConfiguration<boolean>;
  /**
   * Image URL of current playing media.
   */
  media_image_url?: SettableConfiguration<string>;
  /**
   * Title of Playlist currently playing.
   */
  media_playlist?: SettableConfiguration<string>;
  /**
   * Position of current playing media in seconds.
   */
  media_position?: SettableConfiguration<number>;
  /**
   * Timestamp of when _attr_media_position was last updated. The timestamp should be set by calling homeassistant.util.dt.utcnow().
   */
  media_position_updated_at?: SettableConfiguration<Dayjs>;
  /**
   * Season of current playing media, TV show only.
   */
  media_season?: SettableConfiguration<string>;
  /**
   * Title of series of current playing media, TV show only.
   */
  media_series_title?: SettableConfiguration<string>;
  /**
   * Title of current playing media.
   */
  media_title?: SettableConfiguration<string>;
  /**
   * Track number of current playing media, music track only.
   */
  media_track?: SettableConfiguration<string>;
  /**
   * Current repeat mode.
   */
  repeat?: SettableConfiguration<string>;
  /**
   * True if shuffle is enabled.
   */
  shuffle?: SettableConfiguration<boolean>;
  /**
   * The current sound mode of the media player.
   */
  sound_mode?: SettableConfiguration<SOUND_MODES>;
  /**
   * Dynamic list of available sound modes.
   */
  sound_mode_list?: SOUND_MODES[];
  /**
   * The currently selected input source for the media player.
   */
  source?: SettableConfiguration<SOURCES>;
  /**
   * The list of possible input sources for the media player. (This list should contain human readable names, suitable for frontend display).
   */
  source_list?: SOURCES[];

  supported_features?: number;
  /**
   * Volume level of the media player in the range (0..1).
   */
  volume_level?: SettableConfiguration<number>;
  /**
   * Volume step to use for the volume_up and volume_down services.
   */
  volume_step?: SettableConfiguration<string>;
};

export type MediaPlayerEvents = {
  select_sound_mode: { source: string };
  select_source: { source: string };
  play_media: {
    media_type: string;
    media_id: string;
    enqueue?: MediaPlayerEnqueue;
    announce?: boolean;
  };
};

export function VirtualMediaPlayer({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<MediaPlayerConfiguration, MediaPlayerEvents>({
    bus_events: ["select_sound_mode", "select_source", "play_media"],
    context,
    // @ts-expect-error its fine
    domain: "media_player",
    load_config_keys: [
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
  });

  return <LOCALS extends object = object, ATTRIBUTES extends object = object>(
    options: AddEntityOptions<MediaPlayerConfiguration, MediaPlayerEvents, ATTRIBUTES, LOCALS>,
  ) => generate.addEntity(options);
}
