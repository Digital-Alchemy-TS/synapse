import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type WaterHeaterConfiguration = {
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
  current_temperature?: SettableConfiguration<number>;
  /**
   * The temperature we are trying to reach.
   */
  target_temperature?: SettableConfiguration<number>;
  /**
   * Upper bound of the temperature we are trying to reach.
   */
  target_temperature_high?: SettableConfiguration<number>;
  /**
   * Lower bound of the temperature we are trying to reach.
   */
  target_temperature_low?: SettableConfiguration<number>;
  /**
   * One of TEMP_CELSIUS, TEMP_FAHRENHEIT, or TEMP_KELVIN.
   */
  temperature_unit?: string;
  /**
   * The current operation mode.
   */
  current_operation?: SettableConfiguration<string>;
  /**
   * List of possible operation modes.
   */
  operation_list?: string[];
  /**
   * List of supported features.
   */
  supported_features?: number;
  is_away_mode_on?: SettableConfiguration<boolean>;
};

export type WaterHeaterEvents = {
  set_temperature: {
    //
  };
  set_operation_mode: {
    //
  };
  turn_away_mode_on: {
    //
  };
  turn_away_mode_off: {
    //
  };
  turn_on: {
    //
  };
  turn_off: {
    //
  };
};

export function VirtualWaterHeater({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<WaterHeaterConfiguration, WaterHeaterEvents>({
    bus_events: [
      "set_temperature",
      "set_operation_mode",
      "turn_away_mode_on",
      "turn_away_mode_off",
      "turn_on",
      "turn_off",
    ],
    context,
    // @ts-expect-error its fine
    domain: "water_heater",
    load_config_keys: [
      "min_temp",
      "max_temp",
      "current_temperature",
      "target_temperature",
      "target_temperature_high",
      "target_temperature_low",
      "temperature_unit",
      "current_operation",
      "operation_list",
      "supported_features",
      "is_away_mode_on",
    ],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<WaterHeaterConfiguration, WaterHeaterEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
