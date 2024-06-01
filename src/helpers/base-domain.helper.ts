import { TBlackHole, TContext } from "@digital-alchemy/core";
import { TRawDomains } from "@digital-alchemy/hass";
import { createHash } from "crypto";

import { EntityConfigCommon } from "./common-config.helper";
import { TSynapseId } from "./utility.helper";

export type RemovableCallback<DATA extends unknown = unknown> = (
  data: DATA,
  remove: () => void,
) => TBlackHole;

export type CreateRemovableCallback<DATA extends unknown = unknown> = (
  callback: RemovableCallback<DATA>,
) => { remove: () => void };

export type DomainGeneratorOptions<
  CONFIGURATION extends object,
  EVENT_MAP extends Record<string, object>,
> = {
  /**
   * The domain to map the code to on the python side
   */
  domain: TRawDomains;
  /**
   * Context of the synapse extension generating
   */
  context: TContext;
  /**
   * Bus Transfer events
   */
  bus_events?: Extract<keyof EVENT_MAP, string>[];
  /**
   * Keys to map from `add_entity` options -> `proxy.configuration`
   */
  load_config_keys?: Extract<keyof CONFIGURATION, string>[];
  /**
   * What to use instead of `undefined` / `None`
   */
  default_config?: Partial<CONFIGURATION>;
  /**
   * when loading data from hass, map `state` to this config property
   *
   * will automatically use `state` if present in `load_config_keys`
   */
  map_state: Extract<keyof CONFIGURATION, string>;
  /**
   * when loading data from hass, import these config properties from entity attributes
   */
  map_config: Extract<keyof CONFIGURATION, string>[];
};

export type TEventMap = Record<string, object>;

export type AddEntityOptions<
  CONFIGURATION extends object,
  EVENT_MAP extends Record<string, object> = Record<string, object>,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
} & EntityConfigCommon<ATTRIBUTES> &
  CONFIGURATION &
  Partial<{
    [EVENT in keyof EVENT_MAP]: RemovableCallback<EVENT_MAP[EVENT]>;
  }>;

export function generateHash(input: string) {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

export type BaseEvent = {
  data: {
    unique_id: TSynapseId;
  };
};

export const formatObjectId = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replaceAll(/[^\d_a-z]+/g, "_")
    .replaceAll(/^_+|_+$/g, "")
    .replaceAll(/_+/g, "_");

export const LATE_READY = -1;
