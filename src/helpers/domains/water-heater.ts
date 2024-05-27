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

type WaterHeaterStates =
  | "eco"
  | "electric"
  | "performance"
  | "high_demand"
  | "heat_pump"
  | "gas"
  | "off";

export type WaterHeaterConfiguration = EntityConfigCommon & {
  /**
   * The minimum temperature that can be set.
   */
  min_temp?: number;
  /**
   * The maximum temperature that can be set.
   */
  max_temp?: number;
  /**
   * The current temperature.
   */
  current_temperature?: number;
  /**
   * The temperature we are trying to reach.
   */
  target_temperature?: number;
  /**
   * Upper bound of the temperature we are trying to reach.
   */
  target_temperature_high?: number;
  /**
   * Lower bound of the temperature we are trying to reach.
   */
  target_temperature_low?: number;
  /**
   * One of TEMP_CELSIUS, TEMP_FAHRENHEIT, or TEMP_KELVIN.
   */
  temperature_unit?: string;
  /**
   * The current operation mode.
   */
  current_operation?: string;
  /**
   * List of possible operation modes.
   */
  operation_list?: string[];
  /**
   * List of supported features.
   */
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
