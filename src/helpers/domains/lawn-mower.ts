import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseLawnMowerParams = BaseEntityParams<LawnMowerStates> &
  LawnMowerConfiguration & {
    start_mowing?: RemovableCallback;
    dock?: RemovableCallback;
    pause?: RemovableCallback;
  };

type LawnMowerStates = "on" | "off";

export type LawnMowerConfiguration = EntityConfigCommon & {
  /**
   * Current activity.
   */
  activity?: "mowing" | "docked" | "paused" | "error";
  supported_features?: number;
};

export type SynapseVirtualLawnMower = BaseVirtualEntity<
  LawnMowerStates,
  object,
  LawnMowerConfiguration
> & {
  onStartMowing: CreateRemovableCallback;
  onDock: CreateRemovableCallback;
  onPause: CreateRemovableCallback;
};
