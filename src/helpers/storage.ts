import { ENTITY_STATE, PICK_ENTITY, TRawDomains } from "@digital-alchemy/hass";

import { AddEntityOptions } from "./base-domain.helper";
import { EntityConfigCommon } from "./common-config.helper";
import { TSynapseId } from "./utility.helper";

export type TSynapseEntityStorage<CONFIGURATION extends object = object> = {
  unique_id: TSynapseId;
  set: <KEY extends keyof CONFIGURATION>(key: KEY, value: CONFIGURATION[KEY]) => void;
  get: <KEY extends keyof CONFIGURATION>(key: KEY) => CONFIGURATION[KEY];
  isStored(key: string): key is Extract<keyof CONFIGURATION, string>;
  export: () => CONFIGURATION;
};

export type AddStateOptions<CONFIGURATION extends EntityConfigCommon<object>> = {
  domain: TRawDomains;
  entity: AddEntityOptions<CONFIGURATION>;
  /**
   * initial import from typescript defs
   */
  load_config_keys: (keyof AddEntityOptions<CONFIGURATION>)[];
  /**
   * when loading data from hass, map `state` to this config property
   */
  map_state: Extract<keyof CONFIGURATION, string>;
  /**
   * when loading data from hass, import these config properties from entity attributes
   */
  map_config: ConfigMapper<Extract<keyof CONFIGURATION, string>>[];
};

export type ConfigMapper<KEY extends string> =
  | {
      key: KEY;
      load<ENTITY extends PICK_ENTITY>(entity: ENTITY_STATE<ENTITY>): unknown;
    }
  | KEY;
