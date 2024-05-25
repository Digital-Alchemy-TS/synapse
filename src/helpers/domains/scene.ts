import { TBlackHole, TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TScene<ATTRIBUTES extends object = object> = {
  context: TContext;
  // defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & SceneConfiguration;

export type SceneConfiguration = EntityConfigCommon & {
  activate: (remove: () => void) => TBlackHole;
};

export const SCENE_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  // activate should not be included
] as (keyof SceneConfiguration)[];

export type TVirtualScene<
  STATE extends void = void,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends SceneConfiguration = SceneConfiguration,
  ENTITY_ID extends PICK_ENTITY<"sensor"> = PICK_ENTITY<"sensor">,
> = {
  /**
   * Do not define attributes that change frequently.
   * Create new sensors instead
   */
  attributes: ATTRIBUTES;
  configuration: CONFIGURATION;
  _rawAttributes: ATTRIBUTES;
  onActivate: (callback: (remove: () => void) => TBlackHole) => {
    remove: () => void;
  };
  _rawConfiguration: ATTRIBUTES;
  name: string;
  /**
   * look up the entity id, and
   */
  onUpdate: UpdateCallback<ENTITY_ID>;
  /**
   * NOT USED WITH SCENES
   *
   * Virtual scenes are stateless
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};

export type HassSceneUpdateEvent = { data: { unique_id: TSynapseId } };
