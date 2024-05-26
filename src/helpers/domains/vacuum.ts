import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseVacuumParams = BaseEntityParams<VacuumStates> &
  VacuumConfiguration & {
    clean_spot: RemovableCallback;
    locate: RemovableCallback;
    pause: RemovableCallback;
    return_to_base: RemovableCallback;
    send_command: RemovableCallback;
    set_fan_speed: RemovableCallback;
    start: RemovableCallback;
    stop: RemovableCallback;
  };

// supposed to be the same thing
type VacuumStates =
  | "cleaning"
  | "docked"
  | "idle"
  | "paused"
  | "returning"
  | "error";

export type VacuumConfiguration = EntityConfigCommon & {
  battery_level?: number;
  fan_speed?: string;
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
  onSend_command: CreateRemovableCallback;
  onSetFanSpeed: CreateRemovableCallback;
  onStart: CreateRemovableCallback;
  onStop: CreateRemovableCallback;
};
