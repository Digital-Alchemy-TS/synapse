import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseCameraParams = BaseEntityParams<CameraStates> &
  CameraConfiguration & {
    turn_on?: RemovableCallback;
    turn_off?: RemovableCallback;
    enable_motion_detection?: RemovableCallback;
    disable_motion_detection?: RemovableCallback;
  };

type CameraStates = "on" | "off";

export type CameraConfiguration = EntityConfigCommon & {
  /**
   * The brand (manufacturer) of the camera.
   */
  brand?: string;
  /**
   * The interval between frames of the stream.
   */
  frame_interval?: number;
  /**
   * Used with CameraEntityFeature.STREAM to tell the frontend which type of stream to use (StreamType.HLS or StreamType.WEB_RTC)
   */
  frontend_stream_type?: string;
  /**
   * Indication of whether the camera is on.
   */
  is_on?: boolean;
  /**
   * Indication of whether the camera is recording. Used to determine state.
   */
  is_recording?: boolean;
  /**
   * Indication of whether the camera is streaming. Used to determine state.
   */
  is_streaming?: boolean;
  /**
   * The model of the camera.
   */
  model?: string;
  /**
   * Indication of whether the camera has motion detection enabled.
   */
  motion_detection_enabled?: boolean;
  /**
   * Determines whether or not to use the Stream integration to generate still images
   */
  use_stream_for_stills?: boolean;
  supported_features?: number;
};

export type SynapseVirtualCamera = BaseVirtualEntity<CameraStates, object, CameraConfiguration> & {
  onTurnOn?: CreateRemovableCallback;
  onTurnOff?: CreateRemovableCallback;
  onEnableMotionDetection?: CreateRemovableCallback;
  onDisableMotionDetection?: CreateRemovableCallback;
};
