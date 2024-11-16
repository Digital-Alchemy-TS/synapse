import { ENTITY_STATE, PICK_ENTITY, TRawDomains } from "@digital-alchemy/hass";

import { AddEntityOptions } from "./base-domain.mts";
import { EntityConfigCommon } from "./common-config.mts";
import { TSynapseId } from "./utility.mts";

export type TSynapseEntityStorage<CONFIGURATION extends object = object> = {
  unique_id: TSynapseId;
  keys: () => string[];
  purge: () => void;
  set: <KEY extends keyof CONFIGURATION>(key: KEY, value: CONFIGURATION[KEY]) => void;
  get: <KEY extends keyof CONFIGURATION>(key: KEY) => CONFIGURATION[KEY];
  isStored(key: string): key is Extract<keyof CONFIGURATION, string>;
  export: () => CONFIGURATION;
};

export type AddStateOptions<
  ATTRIBUTES extends object,
  LOCALS extends object,
  CONFIGURATION extends EntityConfigCommon<ATTRIBUTES, LOCALS>,
> = {
  domain: TRawDomains;
  entity: AddEntityOptions<CONFIGURATION, Record<string, object>, ATTRIBUTES, LOCALS>;
  /**
   * initial import from typescript defs
   */
  load_config_keys: (keyof AddEntityOptions<
    CONFIGURATION,
    Record<string, object>,
    ATTRIBUTES,
    LOCALS
  >)[];
};

export type ConfigMapper<KEY extends string> =
  | {
      key: KEY;
      load<ENTITY extends PICK_ENTITY>(entity: ENTITY_STATE<ENTITY>): unknown;
    }
  | KEY;
