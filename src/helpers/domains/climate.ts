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
    set_hvac_mode: RemovableCallback<{ hvac_mode: HVACMode }>;
    turn_on: RemovableCallback;
    turn_off: RemovableCallback;
    toggle: RemovableCallback;
    set_preset_mode: RemovableCallback<{ preset_mode: string }>;
    set_fan_mode: RemovableCallback<{ fan_mode: string }>;
    set_humidity: RemovableCallback<{ humidity: number }>;
    set_swing_mode: RemovableCallback<{ swing_mode: string }>;
    set_temperature: RemovableCallback<{ humidity: number }>;
  };

// supposed to be the same thing
type ClimateStates = "on" | "off";

export type ClimateConfiguration = EntityConfigCommon & {
  current_humidity?: number;
  current_temperature?: number;
  fan_mode?: string;
  fan_modes?: string[];
  hvac_action?: HVACAction;
  hvac_mode: HVACMode;
  hvac_modes: HVACMode[];
  max_humidity?: number;
  max_temp?: number;
  min_humidity?: number;
  min_temp?: number;
  precision?: number;
  preset_mode?: string;
  preset_modes?: string[];
  swing_mode?: string;
  swing_modes?: string[];
  target_humidity?: number;
  target_temperature_high?: number;
  target_temperature_low?: number;
  target_temperature_step?: number;
  target_temperature?: number;
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
