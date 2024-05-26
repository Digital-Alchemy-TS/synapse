import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseWaterHeaterParams = BaseEntityParams<WaterHeaterStates> &
  WaterHeaterConfiguration & {
    set_temperature?: RemovableCallback;
    set_operation_mode?: RemovableCallback;
    turn_away_mode_on?: RemovableCallback;
    turn_away_mode_off?: RemovableCallback;
    turn_on?: RemovableCallback;
    turn_off?: RemovableCallback;
  };

// supposed to be the same thing
type WaterHeaterStates =
  | "eco"
  | "electric"
  | "performance"
  | "high_demand"
  | "heat_pump"
  | "gas"
  | "off";

export type WaterHeaterConfiguration = EntityConfigCommon & {
  min_temp?: number;
  max_temp?: number;
  current_temperature?: number;
  target_temperature?: number;
  target_temperature_high?: number;
  target_temperature_low?: number;
  temperature_unit?: string;
  current_operation?: string;
  operation_list?: string[];
  supported_features?: number;
  is_away_mode_on?: boolean;
};

export type SynapseVirtualWaterHeater = BaseVirtualEntity<
  WaterHeaterStates,
  object,
  WaterHeaterConfiguration
> & {
  onSetTemperature?: CreateRemovableCallback;
  onSetOperationMode?: CreateRemovableCallback;
  onTurnAwayModeOn?: CreateRemovableCallback;
  onTurnAwayModeOff?: CreateRemovableCallback;
  onTurnOn?: CreateRemovableCallback;
  onTurnOff?: CreateRemovableCallback;
};
