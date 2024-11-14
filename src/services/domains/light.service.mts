import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../../helpers/index.mts";

export type LightConfiguration<COLOR_MODES extends string = string> = {
  /**
   * The brightness of this light between 1..255
   */
  brightness?: SettableConfiguration<number>;
  /**
   * The color mode of the light.
   * The returned color mode must be present in the supported_color_modes property unless the light is rendering an effect.
   */
  color_mode?: SettableConfiguration<COLOR_MODES>;
  /**
   * The CT color value in K.
   * This property will be copied to the light's state attribute when the light's color mode is set to ColorMode.COLOR_TEMP and ignored otherwise.
   */
  color_temp_kelvin?: SettableConfiguration<number>;
  /**
   * The current effect.
   * Should be EFFECT_OFF if the light supports effects and no effect is currently rendered.
   */
  effect?: SettableConfiguration<string>;
  /**
   * The list of supported effects.
   */
  effect_list?: string[];
  /**
   * The hue and saturation color value (float, float).
   * This property will be copied to the light's state attribute when the light's color mode is set to ColorMode.HS and ignored otherwise.
   */
  hs_color?: SettableConfiguration<[number, number]>;
  /**
   * If the light entity is on or not.
   */
  is_on?: SettableConfiguration<boolean>;
  /**
   * The coldest color_temp_kelvin that this light supports.
   */
  max_color_temp_kelvin?: number;
  /**
   * The warmest color_temp_kelvin that this light supports.
   */
  min_color_temp_kelvin?: number;
  /**
   * The rgb color value (int, int, int).
   * This property will be copied to the light's state attribute when the light's color mode is set to ColorMode.
   * RGB and ignored otherwise.
   */
  rgb_color?: SettableConfiguration<[r: number, g: number, b: number]>;
  /**
   * The rgbw color value (int, int, int, int).
   * This property will be copied to the light's state attribute when the light's color mode is set to ColorMode.
   * RGBW and ignored otherwise.
   */
  rgbw_color?: SettableConfiguration<[r: number, g: number, b: number, w: number]>;
  /**
   * The rgbww color value (int, int, int, int, int).
   * This property will be copied to the light's state attribute when the light's color mode is set to ColorMode.
   * RGBWW and ignored otherwise.
   */
  rgbww_color?: SettableConfiguration<[r: number, g: number, b: number, w: number, w: number]>;
  /**
   * Flag supported color modes.
   */
  supported_color_modes?: COLOR_MODES[];
  supported_features?: number;
  /**
   * The xy color value (float, float).
   * This property will be copied to the light's state attribute when the light's color mode is set to ColorMode.XY and ignored otherwise.
   */
  xy_color?: SettableConfiguration<[number, number]>;
};

export type LightEvents = {
  turn_on: {
    //
  };
  turn_off: {
    //
  };
};

export function VirtualLight({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<LightConfiguration, LightEvents>({
    bus_events: ["turn_on", "turn_off"],
    context,
    domain: "light",
    load_config_keys: [
      "brightness",
      "color_mode",
      "color_temp_kelvin",
      "effect",
      "effect_list",
      "hs_color",
      "is_on",
      "max_color_temp_kelvin",
      "min_color_temp_kelvin",
      "rgb_color",
      "rgbw_color",
      "rgbww_color",
      "supported_color_modes",
      "supported_features",
      "xy_color",
    ],
  });

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      LightConfiguration,
      LightEvents,
      PARAMS["attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
