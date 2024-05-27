import { HVACAction, HVACMode } from "@digital-alchemy/hass";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseClimateParams = BaseEntityParams<ClimateStates> &
  ClimateConfiguration & {
    set_hvac_mode?: RemovableCallback<{ hvac_mode: HVACMode }>;
    turn_on?: RemovableCallback;
    turn_off?: RemovableCallback;
    toggle?: RemovableCallback;
    set_preset_mode?: RemovableCallback<{ preset_mode: string }>;
    set_fan_mode?: RemovableCallback<{ fan_mode: string }>;
    set_humidity?: RemovableCallback<{ humidity: number }>;
    set_swing_mode?: RemovableCallback<{ swing_mode: string }>;
    set_temperature?: RemovableCallback<{ humidity: number }>;
  };

type ClimateStates = "on" | "off";

export type ClimateConfiguration = EntityConfigCommon & {
  /**
   * The current humidity.
   */
  current_humidity?: number;
  /**
   * The current temperature.
   */
  current_temperature?: number;
  /**
   * The current fan mode.
   */
  fan_mode?: string;
  /**
   * The list of available fan modes.
   */
  fan_modes?: string[];
  /**
   * The current HVAC action (heating, cooling)
   */
  hvac_action?: HVACAction;
  /**
   * The current operation (e.g. heat, cool, idle). Used to determine state.
   */
  hvac_mode: HVACMode;
  /**
   * List of available operation modes.
   */
  hvac_modes: HVACMode[];
  /**
   * The maximum humidity.
   */
  max_humidity?: number;
  /**
   * The maximum temperature in temperature_unit.
   */
  max_temp?: number;
  /**
   * The minimum humidity.
   */
  min_humidity?: number;
  /**
   * The minimum temperature in temperature_unit.
   */
  min_temp?: number;
  /**
   * The precision of the temperature in the system. Defaults to tenths for TEMP_CELSIUS, whole number otherwise.
   */
  precision?: number;
  /**
   * The current active preset.
   */
  preset_mode?: string;
  /**
   * The available presets.
   */
  preset_modes?: string[];
  /**
   * The swing setting.
   */
  swing_mode?: string;
  /**
   * Returns the list of available swing modes.
   */
  swing_modes?: string[];
  /**
   * The target humidity the device is trying to reach.
   */
  target_humidity?: number;
  /**
   * The temperature currently set to be reached.
   */
  target_temperature_high?: number;
  /**
   * The upper bound target temperature
   */
  target_temperature_low?: number;
  /**
   * The lower bound target temperature
   */
  target_temperature_step?: number;
  /**
   * The supported step size a target temperature can be increased or decreased
   */
  target_temperature?: number;
  /**
   * The unit of temperature measurement for the system (TEMP_CELSIUS or TEMP_FAHRENHEIT).
   */
  temperature_unit: string;
};

export type SynapseVirtualClimate = BaseVirtualEntity<
  ClimateStates,
  object,
  ClimateConfiguration
> & {
  onSetHvacMode: CreateRemovableCallback;
  onTurnOn: CreateRemovableCallback;
  onTurnOff: CreateRemovableCallback;
  onToggle: CreateRemovableCallback;
  onSetPresetMode: CreateRemovableCallback<{ preset_mode: string }>;
  onSetFanMode: CreateRemovableCallback<{ fan_mode: string }>;
  onSetHumidity: CreateRemovableCallback<{ humidity: number }>;
  onSetSwingMode: CreateRemovableCallback<{ swing_mode: string }>;
  onSetTemperature: CreateRemovableCallback<{ humidity: number }>;
};
