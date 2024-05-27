import { HumidifierDeviceClass } from "@digital-alchemy/hass";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseHumidifierParams = BaseEntityParams<HumidifierStates> &
  HumidifierConfiguration & {
    set_humidity?: RemovableCallback<{ humidity: number }>;
    turn_on?: RemovableCallback;
    turn_off?: RemovableCallback;
  };

type HumidifierStates = "on" | "off";
type HumidifierModes =
  | "normal"
  | "eco"
  | "away"
  | "boost"
  | "comfort"
  | "home"
  | "sleep"
  | "auto"
  | "baby";

export type HumidifierConfiguration = EntityConfigCommon & {
  /**
   * Returns the current status of the device.
   */
  action?: string;
  /**
   * The available modes. Requires `SUPPORT_MODES`.
   */
  available_modes?: `${HumidifierModes}`[];
  /**
   * The current humidity measured by the device.
   */
  current_humidity?: number;
  /**
   * Type of hygrostat
   */
  device_class?: `${HumidifierDeviceClass}`;
  /**
   * Whether the device is on or off.
   */
  is_on?: boolean;
  /**
   * The maximum humidity.
   */
  max_humidity?: number;
  /**
   * The minimum humidity.
   */
  min_humidity?: string;
  /**
   * The current active mode. Requires `SUPPORT_MODES`.
   */
  mode?: `${HumidifierModes}`;
  /**
   * The target humidity the device is trying to reach.
   */
  target_humidity?: number;
};

export type SynapseVirtualHumidifier = BaseVirtualEntity<
  HumidifierStates,
  object,
  HumidifierConfiguration
> & {
  onSetHumidity: CreateRemovableCallback<{ humidity: number }>;
  onTurnOn: CreateRemovableCallback;
  onTurnOff: CreateRemovableCallback;
};
