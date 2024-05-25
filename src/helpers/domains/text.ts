import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TText<
  STATE extends TextValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & TextConfiguration;

export type TextConfiguration = EntityConfigCommon & {
  /**
   * Defines how the text should be displayed in the UI.
   * It's recommended to use the default `auto`.
   * Can be `box` or `slider` to force a display mode.
   */
  mode?: "text" | "password";
  max?: number;
  min?: number;
  step?: string;
  pattern?: string;
};

export type TextValue = string;

export const TEXT_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "mode",
  "max",
  "min",
  "step",
  "pattern",
] as (keyof TextConfiguration)[];

export type HassTextEvent = { data: { unique_id: TSynapseId } };

export type TVirtualText<
  STATE extends TextValue = TextValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends TextConfiguration = TextConfiguration,
  // @ts-expect-error its fine
  ENTITY_ID extends PICK_ENTITY<"text"> = PICK_ENTITY<"text">,
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
