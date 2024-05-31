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

type ValveStates = "opening" | "open" | "closing" | "closed";

export type ValveConfiguration = EntityConfigCommon & {
  /**
   * The current position of the valve where 0 means closed and 100 is fully open.
   * This attribute is required on valves with reports_position = True, where it's used to determine state.
   */
  current_valve_position?: number;
  /**
   * If the valve is closed or not. Used to determine state for valves that don't report position.
   */
  is_closed?: boolean;
  /**
   * If the valve is opening or not. Used to determine state.
   */
  is_opening?: boolean;
  /**
   * If the valve knows its position or not.
   */
  reports_position: boolean;
  device_class?: `${ValveDeviceClass}`;
  /**
   * If the valve is closing or not. Used to determine state.
   */
  is_closing?: boolean;
  supported_features?: number;
};

export type SynapseVirtualValve = BaseVirtualEntity<ValveStates, object, ValveConfiguration> & {
  onOpenValve?: CreateRemovableCallback;
  onCloseValve?: CreateRemovableCallback;
  onSetValvePosition?: CreateRemovableCallback;
  onStopValve?: CreateRemovableCallback;
};
