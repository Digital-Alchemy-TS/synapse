import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import { Dayjs } from "dayjs";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TDateTime<
  STATE extends DateTimeValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & DateTimeConfiguration;

export type DateTimeConfiguration = EntityConfigCommon;

export type DateTimeValue = Dayjs;

export const DATETIME_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
] as (keyof DateTimeConfiguration)[];

export type HassDateTimeEvent = { data: { unique_id: TSynapseId } };

export type TVirtualDateTime<
  STATE extends DateTimeValue = DateTimeValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends DateTimeConfiguration = DateTimeConfiguration,
  // @ts-expect-error its fine
  ENTITY_ID extends PICK_ENTITY<"datetime"> = PICK_ENTITY<"datetime">,
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
