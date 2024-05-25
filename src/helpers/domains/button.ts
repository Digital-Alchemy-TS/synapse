import { TBlackHole, TContext } from "@digital-alchemy/core";
import { ButtonDeviceClass, PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TButton<ATTRIBUTES extends object = object> = {
  context: TContext;
  // defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & ButtonConfiguration;

export type ButtonConfiguration = EntityConfigCommon & {
  press?: (remove: () => void) => TBlackHole;
  device_class?: `${ButtonDeviceClass}`;
};

export const BUTTON_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
  // press should not be included
] as (keyof ButtonConfiguration)[];

export type TVirtualButton<
  STATE extends void = void,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends ButtonConfiguration = ButtonConfiguration,
  ENTITY_ID extends PICK_ENTITY<"sensor"> = PICK_ENTITY<"sensor">,
> = {
  /**
   * Do not define attributes that change frequently.
   * Create new sensors instead
   */
  attributes: ATTRIBUTES;
  configuration: CONFIGURATION;
  onPress: (callback: (remove: () => void) => TBlackHole) => void;
  _rawAttributes: ATTRIBUTES;
  _rawConfiguration: ATTRIBUTES;
  name: string;
  /**
   * look up the entity id, and proxy update events
   */
  onUpdate: UpdateCallback<ENTITY_ID>;
  /**
   * NOT USED WITH BUTTONS
   *
   * Virtual buttons are stateless
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};

export type HassButtonUpdateEvent = { data: { unique_id: TSynapseId } };
