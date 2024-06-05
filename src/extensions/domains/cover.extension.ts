import { TServiceParams } from "@digital-alchemy/core";
import { CoverDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type CoverConfiguration = {
  /**
   * The current position of cover where 0 means closed and 100 is fully open.
   */
  current_cover_position?: SettableConfiguration<number>;
  /**
   * The current tilt position of the cover where 0 means closed/no tilt and 100 means open/maximum tilt.
   */
  current_cover_tilt_position?: SettableConfiguration<number>;
  device_class?: `${CoverDeviceClass}`;
  /**
   * If the cover is closed or not. Used to determine state.
   */
  is_closed?: SettableConfiguration<boolean>;
  /**
   * If the cover is closing or not. Used to determine state.
   */
  is_closing?: SettableConfiguration<boolean>;
  /**
   * If the cover is opening or not. Used to determine state.
   */
  is_opening?: SettableConfiguration<boolean>;
};

export type CoverEvents = {
  stop_cover_tilt: {
    //
  };
  set_cover_tilt_position: {
    //
  };
  close_cover_tilt: {
    //
  };
  open_cover_tilt: {
    //
  };
  stop_cover: {
    //
  };
  set_cover_position: {
    //
  };
  close_cover: {
    //
  };
  open_cover: {
    //
  };
};

export function VirtualCover({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<CoverConfiguration, CoverEvents>({
    bus_events: [
      "stop_cover_tilt",
      "set_cover_tilt_position",
      "close_cover_tilt",
      "open_cover_tilt",
      "stop_cover",
      "set_cover_position",
      "close_cover",
      "open_cover",
    ],
    context,
    // @ts-expect-error its fine
    domain: "cover",
    load_config_keys: [
      "current_cover_position",
      "current_cover_tilt_position",
      "device_class",
      "is_closed",
      "is_closing",
      "is_opening",
    ],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<CoverConfiguration, CoverEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
