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
  brand?: string;
  frame_interval?: number;
  frontend_stream_type?: string;
  is_on?: boolean;
  is_recording?: boolean;
  is_streaming?: boolean;
  model?: string;
  motion_detection_enabled?: boolean;
  use_stream_for_stills?: boolean;
  supported_features?: number;
};

export type SynapseVirtualCamera = BaseVirtualEntity<
  CameraStates,
  object,
  CameraConfiguration
> & {
  onTurnOn?: CreateRemovableCallback;
  onTurnOff?: CreateRemovableCallback;
  onEnableMotionDetection?: CreateRemovableCallback;
  onDisableMotionDetection?: CreateRemovableCallback;
};
