import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import { Dayjs } from "dayjs";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TTime<
  STATE extends TimeValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & TimeConfiguration;

export type TimeConfiguration = EntityConfigCommon;

export type TimeValue = Dayjs;

export const TIME_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
] as (keyof TimeConfiguration)[];

export type HassTimeEvent = { data: { unique_id: TSynapseId } };

export type TVirtualTime<
  STATE extends TimeValue = TimeValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends TimeConfiguration = TimeConfiguration,
  // @ts-expect-error its fine
  ENTITY_ID extends PICK_ENTITY<"time"> = PICK_ENTITY<"time">,
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
