import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseVacuumParams = BaseEntityParams<VacuumStates> &
  VacuumConfiguration & {
    clean_spot?: RemovableCallback;
    locate?: RemovableCallback;
    pause?: RemovableCallback;
    return_to_base?: RemovableCallback;
    send_command?: RemovableCallback;
    set_fan_speed?: RemovableCallback;
    start?: RemovableCallback;
    stop?: RemovableCallback;
  };

type VacuumStates =
  | "cleaning"
  | "docked"
  | "idle"
  | "paused"
  | "returning"
  | "error";

export type VacuumConfiguration = EntityConfigCommon & {
  /**
   * Current battery level.
   */
  battery_level?: number;
  /**
   * The current fan speed.
   */
  fan_speed?: string;
  /**
   * List of available fan speeds.
   */
  fan_speed_list?: string[];
  supported_features?: number;
};

export type SynapseVirtualVacuum = BaseVirtualEntity<
  VacuumStates,
  object,
  VacuumConfiguration
> & {
  onCleanSpot: CreateRemovableCallback;
  onLocate: CreateRemovableCallback;
  onPause: CreateRemovableCallback;
  onReturnToBase: CreateRemovableCallback;
  onSendCommand: CreateRemovableCallback;
  onSetFanSpeed: CreateRemovableCallback;
  onStart: CreateRemovableCallback;
  onStop: CreateRemovableCallback;
};
