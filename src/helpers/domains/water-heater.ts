import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TWaterHeater<
  STATE extends WaterHeaterValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & WaterHeaterConfiguration;

export type WaterHeaterConfiguration = EntityConfigCommon & {
  min_temp?: number;
  max_temp?: number;
  current_temperature?: number;
  target_temperature?: number;
  target_temperature_high?: number;
  target_temperature_low?: number;
  temperature_unit?: "kelvin" | "fahrenheit" | "celsius";
  current_operation?: string;
  operation_list?: string[];
  supported_features?: number;
  is_away_mode_on?: boolean;
};

export type WaterHeaterValue =
  | "eco"
  | "electric"
  | "performance"
  | "high_demand"
  | "off"
  | "heat_pump"
  | "gas";

export const ALARM_CONTROL_PANEL_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
] as (keyof WaterHeaterConfiguration)[];

export type HassWaterHeaterEvent = {
  data: { unique_id: TSynapseId };
};

export type RemoveReturn = { remove: () => void };

export type TVirtualWaterHeater<
  STATE extends WaterHeaterValue = WaterHeaterValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends WaterHeaterConfiguration = WaterHeaterConfiguration,
  ENTITY_ID extends PICK_ENTITY<"sensor"> = PICK_ENTITY<"sensor">,
> = {
  /**
   * Do not define attributes that change frequently.
   * Create new sensors instead
   */
  attributes: ATTRIBUTES;
  configuration: CONFIGURATION;
  _rawAttributes: ATTRIBUTES;
  _rawConfiguration: ATTRIBUTES;
  name: string;
  /**
   * look up the entity id, and
   */
  onUpdate: UpdateCallback<ENTITY_ID>;
  /**
   * the current state
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};
