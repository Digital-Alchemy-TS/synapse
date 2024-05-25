import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import { Dayjs } from "dayjs";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TSelect<
  STATE extends SelectValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & SelectConfiguration;

export type SelectConfiguration = EntityConfigCommon & {
  options: string[];
};

export type SelectValue = Dayjs;

export const SELECT_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
] as (keyof SelectConfiguration)[];

export type HassSelectEvent = { data: { unique_id: TSynapseId } };

export type TVirtualSelect<
  STATE extends SelectValue = SelectValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends SelectConfiguration = SelectConfiguration,
  // @ts-expect-error its fine
  ENTITY_ID extends PICK_ENTITY<"select"> = PICK_ENTITY<"select">,
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
