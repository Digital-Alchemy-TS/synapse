import { ValveDeviceClass } from "@digital-alchemy/hass";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseValveParams = BaseEntityParams<ValveStates> &
  ValveConfiguration & {
    open_valve?: RemovableCallback;
    close_valve?: RemovableCallback;
    set_valve_position?: RemovableCallback;
    stop_valve?: RemovableCallback;
  };

// supposed to be the same thing
type ValveStates = "opening" | "open" | "closing" | "closed";

export type ValveConfiguration = EntityConfigCommon & {
  current_valve_position?: number;
  is_closed?: boolean;
  is_opening?: boolean;
  reports_position: boolean;
  device_class?: `${ValveDeviceClass}`;
  is_closing?: boolean;
  supported_features?: number;
};

export type SynapseVirtualValve = BaseVirtualEntity<
  ValveStates,
  object,
  ValveConfiguration
> & {
  onOpenValve?: CreateRemovableCallback;
  onCloseValve?: CreateRemovableCallback;
  onSetValvePosition?: CreateRemovableCallback;
  onStopValve?: CreateRemovableCallback;
};
