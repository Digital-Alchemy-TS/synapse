import { SwitchDeviceClass } from "@digital-alchemy/hass";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseSwitchParams = BaseEntityParams<SwitchValue> &
  SwitchConfiguration & {
    /**
     * By default switches will manage their own state in response to events.
     * Set to to false to disable auto management of state.
     */
    managed?: boolean;
    turn_on?: RemovableCallback;
    turn_off?: RemovableCallback;
    toggle?: RemovableCallback;
  };

export type SwitchConfiguration = EntityConfigCommon & {
  device_class?: `${SwitchDeviceClass}`;
  /**
   * If the switch is currently on or off.
   */
  is_on?: boolean;
};

export type SwitchValue = "on" | "off";

export type SynapseVirtualSwitch = BaseVirtualEntity<
  SwitchValue,
  object,
  SwitchConfiguration
> & {
  is_on: boolean;
  onTurnOff: CreateRemovableCallback;
  onToggle: CreateRemovableCallback;
  onTurnOn: CreateRemovableCallback;
};
