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
    stop_cover_tilt?: RemovableCallback;
    set_cover_tilt_position?: RemovableCallback;
    close_cover_tilt?: RemovableCallback;
    open_cover_tilt?: RemovableCallback;
    stop_cover?: RemovableCallback;
    set_cover_position?: RemovableCallback;
    close_cover?: RemovableCallback;
    open_cover?: RemovableCallback;
  };

type CoverStates = "opening" | "open" | "closing" | "closed";

export type CoverConfiguration = EntityConfigCommon & {
  /**
   * The current position of cover where 0 means closed and 100 is fully open.
   */
  current_cover_position?: number;
  /**
   * The current tilt position of the cover where 0 means closed/no tilt and 100 means open/maximum tilt.
   */
  current_cover_tilt_position?: number;
  device_class?: `${CoverDeviceClass}`;
  /**
   * If the cover is closed or not. Used to determine state.
   */
  is_closed?: boolean;
  /**
   * If the cover is closing or not. Used to determine state.
   */
  is_closing?: boolean;
  /**
   * If the cover is opening or not. Used to determine state.
   */
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
