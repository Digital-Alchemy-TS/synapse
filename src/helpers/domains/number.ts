import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";
import { SensorDeviceClasses } from "./sensor";

export type TNumber<
  STATE extends NumberValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & NumberConfiguration;
export type NumberDeviceClasses = SensorDeviceClasses;

export type NumberConfiguration = EntityConfigCommon &
  NumberDeviceClasses & {
    /**
     * Defines how the number should be displayed in the UI.
     * It's recommended to use the default `auto`.
     * Can be `box` or `slider` to force a display mode.
     */
    mode?: "auto" | "slider" | "box";
    max_value?: number;
    min_value?: number;
    step?: number;
  };

export type NumberValue = number;

export const NUMBER_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
] as (keyof NumberConfiguration)[];

export type HassNumberEvent = { data: { unique_id: TSynapseId } };

export type TVirtualNumber<
  STATE extends NumberValue = NumberValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends NumberConfiguration = NumberConfiguration,
  // @ts-expect-error its fine
  ENTITY_ID extends PICK_ENTITY<"number"> = PICK_ENTITY<"number">,
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
