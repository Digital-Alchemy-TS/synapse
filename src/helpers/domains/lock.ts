import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TLock<
  STATE extends LockValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & LockConfiguration;

export type LockConfiguration = EntityConfigCommon & {
  changed_by?: string;
  code_format?: string;
  is_locked?: boolean;
  is_locking?: boolean;
  is_unlocking?: boolean;
  is_jammed?: boolean;
  is_opening?: boolean;
  is_open?: boolean;
  supported_features?: number;
};

export type LockValue = "locked" | "unlocked";

export const LOCK_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
] as (keyof LockConfiguration)[];

export type HassLockEvent = { data: { unique_id: TSynapseId } };

export type TVirtualLock<
  STATE extends LockValue = LockValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends LockConfiguration = LockConfiguration,
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
  is_locked: boolean;
  name: string;
  onUnlock: () => void;
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
