import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY, SwitchDeviceClass } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TSwitch<
  STATE extends SwitchValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & SwitchConfiguration;

export type SwitchConfiguration = EntityConfigCommon & {
  device_class?: `${SwitchDeviceClass}`;
};

export type SwitchValue = "on" | "off";

export const SWITCH_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
] as (keyof SwitchConfiguration)[];

export type HassSwitchEvent = { data: { unique_id: TSynapseId } };

export type TVirtualSwitch<
  STATE extends SwitchValue = SwitchValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends SwitchConfiguration = SwitchConfiguration,
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
