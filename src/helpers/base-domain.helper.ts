import { TBlackHole, TContext } from "@digital-alchemy/core";
import { TRawDomains } from "@digital-alchemy/hass";
import { createHash } from "crypto";
import { EmptyObject } from "type-fest";

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
  SERIALIZE_TYPES extends unknown = unknown,
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
} & (
  | {
      serialize: (data: SERIALIZE_TYPES, options: CONFIGURATION) => string;
      unserialize: (data: string, options: CONFIGURATION) => SERIALIZE_TYPES;
    }
  | EmptyObject
);

export type TEventMap = Record<string, object>;

export type AddEntityOptions<
  CONFIGURATION extends object,
  EVENT_MAP extends Record<string, object>,
  ATTRIBUTES extends object,
  LOCALS extends object,
> = {
  context: TContext;
} & EntityConfigCommon<ATTRIBUTES, LOCALS> &
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
