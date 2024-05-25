import { CoverDeviceClass } from "@digital-alchemy/hass";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseCoverParams = BaseEntityParams<CoverStates> &
  CoverConfiguration & {
    stop_cover_tilt: RemovableCallback;
    set_cover_tilt_position: RemovableCallback;
    close_cover_tilt: RemovableCallback;
    open_cover_tilt: RemovableCallback;
    stop_cover: RemovableCallback;
    set_cover_position: RemovableCallback;
    close_cover: RemovableCallback;
    open_cover: RemovableCallback;
  };

// supposed to be the same thing
type CoverStates = "opening" | "open" | "closing" | "closed";

export type CoverConfiguration = EntityConfigCommon & {
  current_cover_position?: number;
  current_cover_tilt_position?: number;
  device_class?: `${CoverDeviceClass}`;
  is_closed?: boolean;
  is_closing?: boolean;
  is_opening?: boolean;
};

export type SynapseVirtualCover = BaseVirtualEntity<
  CoverStates,
  object,
  CoverConfiguration
> & {
  onStopCoverTilt: CreateRemovableCallback;
  onSetCoverTiltPosition: CreateRemovableCallback;
  onCloseCoverTilt: CreateRemovableCallback;
  onOpenCoverTilt: CreateRemovableCallback;
  onStopCover: CreateRemovableCallback;
  onSetCoverPosition: CreateRemovableCallback;
  onCloseCover: CreateRemovableCallback;
  onOpenCover: CreateRemovableCallback;
};
