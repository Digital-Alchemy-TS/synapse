import { Dayjs } from "dayjs";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseMediaPlayerParams = BaseEntityParams<MediaPlayerStates> &
  MediaPlayerConfiguration & {
    play_media?: RemovableCallback<{
      media_type: string;
      media_id: string;
      enqueue?: MediaPlayerEnqueue;
      announce?: boolean;
    }>;
    select_sound_mode?: RemovableCallback<{ sound_mode: string }>;
    select_source?: RemovableCallback<{ source: string }>;
  };

type MediaPlayerEnqueue = "add" | "next" | "play" | "replace";

type MediaPlayerStates = "off" | "on" | "idle" | "playing" | "paused" | "standby" | "buffering";

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

export type MediaPlayerConfiguration = EntityConfigCommon & {
  /**
   * ID of the current running app.
   */
  app_id?: string;
  /**
   * Name of the current running app.
   */
  app_name?: string;
  /**
   * Type of media player.
   */
  device_class?: `${MediaDeviceClass}`;
  /**
   * A dynamic list of player entities which are currently grouped together for synchronous playback.
   * If the platform has a concept of defining a group leader, the leader should be the first element in that list.
   */
  group_members?: string[];
  /**
   * True if if volume is currently muted.
   */
  is_volume_muted?: boolean;
  /**
   * Album artist of current playing media, music track only.
   */
  media_album_artist?: string;
  /**
   * Album name of current playing media, music track only.
   */
  media_album_name?: string;
  /**
   * Album artist of current playing media, music track only.
   */
  media_artist?: string;
  /**
   * Channel currently playing.
   */
  media_channel?: string;
  /**
   * Content ID of current playing media.
   */
  media_content_id?: string;
  /**
   * Content type of current playing media.
   */
  media_content_type?: `${MediaType}`;
  /**
   * Duration of current playing media in seconds.
   */
  media_duration?: number;
  /**
   * Episode of current playing media, TV show only.
   */
  media_episode?: string;
  /**
   * Hash of media image, defaults to SHA256 of media_image_url if media_image_url is not None.
   */
  media_image_hash?: string;
  /**
   * True if property media_image_url is accessible outside of the home network.
   */
  media_image_remotely_accessible?: boolean;
  /**
   * Image URL of current playing media.
   */
  media_image_url?: string;
  /**
   * Title of Playlist currently playing.
   */
  media_playlist?: string;
  /**
   * Position of current playing media in seconds.
   */
  media_position?: number;
  /**
   * Timestamp of when _attr_media_position was last updated. The timestamp should be set by calling homeassistant.util.dt.utcnow().
   */
  media_position_updated_at?: Dayjs;
  /**
   * Season of current playing media, TV show only.
   */
  media_season?: string;
  /**
   * Title of series of current playing media, TV show only.
   */
  media_series_title?: string;
  /**
   * Title of current playing media.
   */
  media_title?: string;
  /**
   * Track number of current playing media, music track only.
   */
  media_track?: string;
  /**
   * Current repeat mode.
   */
  repeat?: string;
  /**
   * True if shuffle is enabled.
   */
  shuffle?: boolean;
  /**
   * The current sound mode of the media player.
   */
  sound_mode?: string;
  /**
   * Dynamic list of available sound modes.
   */
  sound_mode_list?: string[];
  /**
   * The currently selected input source for the media player.
   */
  source?: string;
  /**
   * The list of possible input sources for the media player. (This list should contain human readable names, suitable for frontend display).
   */
  source_list?: string[];

  supported_features?: number;
  /**
   * Volume level of the media player in the range (0..1).
   */
  volume_level?: number;
  /**
   * Volume step to use for the volume_up and volume_down services.
   */
  volume_step?: string;
};

export type SynapseVirtualMediaPlayer = BaseVirtualEntity<
  MediaPlayerStates,
  object,
  MediaPlayerConfiguration
> & {
  onPlayMedia?: CreateRemovableCallback<{
    media_type: string;
    media_id: string;
    enqueue?: MediaPlayerEnqueue;
    announce?: boolean;
  }>;
  onSelectSoundMode?: CreateRemovableCallback<{ sound_mode: string }>;
  onSelectSource?: CreateRemovableCallback<{ source: string }>;
};
