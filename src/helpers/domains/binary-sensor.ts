import { TContext } from "@digital-alchemy/core";
import { BinarySensorDeviceClass, PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";

export type TBinarySensor<
  STATE extends BinarySensorValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & BinarySensorConfiguration;

export type BinarySensorConfiguration = EntityConfigCommon & {
  device_class?: `${BinarySensorDeviceClass}`;
};

export type BinarySensorValue = "on" | "off";

export const BINARY_SENSOR_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
] as (keyof BinarySensorConfiguration)[];

export type TVirtualBinarySensor<
  STATE extends BinarySensorValue = BinarySensorValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends BinarySensorConfiguration = BinarySensorConfiguration,
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
  is_on: boolean;
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
