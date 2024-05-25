import { TBlackHole, TContext } from "@digital-alchemy/core";
import { ENTITY_STATE, PICK_ENTITY } from "@digital-alchemy/hass";

import { RemoveReturn } from "./domains";

export type BaseEntityParams<
  STATE extends unknown,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
  unique_id?: string;
};

export type UpdateCallback<ENTITY_ID extends PICK_ENTITY> = (
  callback: (
    new_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    old_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    remove: () => TBlackHole,
  ) => TBlackHole,
) => RemoveReturn;

export type BaseVirtualEntity<
  STATE extends unknown,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends object = object,
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
  onUpdate: UpdateCallback<PICK_ENTITY>;
  /**
   * the current state
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};

export const VIRTUAL_ENTITY_BASE_KEYS = [
  "attributes",
  "configuration",
  "_rawAttributes",
  "_rawConfiguration",
  "name",
  "state",
  "onUpdate",
];

export type RemovableCallback<DATA extends unknown = unknown> = (
  data: DATA,
  remove: () => void,
) => TBlackHole;

export type CreateRemovableCallback<DATA extends unknown = unknown> = (
  callback: RemovableCallback<DATA>,
) => { remove: () => void };
