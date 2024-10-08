import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../..";

export type CameraConfiguration = {
  /**
   * The brand (manufacturer) of the camera.
   */
  brand?: string;
  /**
   * The interval between frames of the stream.
   */
  frame_interval?: SettableConfiguration<number>;
  /**
   * Used with CameraEntityFeature.STREAM to tell the frontend which type of stream to use (StreamType.HLS or StreamType.WEB_RTC)
   */
  frontend_stream_type?: string;
  /**
   * Indication of whether the camera is on.
   */
  is_on?: SettableConfiguration<boolean>;
  /**
   * Indication of whether the camera is recording. Used to determine state.
   */
  is_recording?: SettableConfiguration<boolean>;
  /**
   * Indication of whether the camera is streaming. Used to determine state.
   */
  is_streaming?: SettableConfiguration<boolean>;
  /**
   * The model of the camera.
   */
  model?: string;
  /**
   * Indication of whether the camera has motion detection enabled.
   */
  motion_detection_enabled?: SettableConfiguration<boolean>;
  /**
   * Determines whether or not to use the Stream integration to generate still images
   */
  use_stream_for_stills?: boolean;
  supported_features?: number;
};

export type CameraEvents = {
  turn_on: {
    //
  };
  turn_off: {
    //
  };
  enable_motion_detection: {
    //
  };
  disable_motion_detection: {
    //
  };
};

export function VirtualCamera({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<CameraConfiguration, CameraEvents>({
    bus_events: ["turn_on", "turn_off", "enable_motion_detection", "disable_motion_detection"],
    context,
    // @ts-expect-error its fine
    domain: "camera",
    load_config_keys: [
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
  });

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      CameraConfiguration,
      CameraEvents,
      PARAMS["attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
