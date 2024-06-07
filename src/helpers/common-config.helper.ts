import { CronExpression, is, TBlackHole } from "@digital-alchemy/core";
import { ByIdProxy, PICK_ENTITY, TEntityUpdateCallback } from "@digital-alchemy/hass";
import { CamelCase, Except } from "type-fest";

import { CreateRemovableCallback, TEventMap } from "./base-domain.helper";
import { TSynapseEntityStorage } from "./storage";
import { TSynapseDeviceId } from "./utility.helper";

export type EntityConfigCommon<ATTRIBUTES extends object> = {
  /**
   * Use a different device to register this entity
   */
  device_id?: TSynapseDeviceId;
  /**
   * Attempt to create the entity id using this string
   *
   * `binary_sensor.{suggested id}`
   *
   * Home assistant _may_ append numbers to the end in case of object_id conflicts where `unique_id` isn't the same.
   *
   * > **NOTE:** Default value based on `name`
   */
  suggested_object_id?: string;
  /**
   * Provide your own unique id for this entity
   *
   * This ID uniquely identifies the entity, through `entity_id` renames
   */
  unique_id?: string;
  icon?: SettableConfiguration<string>;
  /**
   * An entity with a category will:
   * - Not be exposed to cloud, Alexa, or Google Assistant components
   * - Not be included in indirect service calls to devices or areas
   *
   * **Config**: An entity which allows changing the configuration of a device.
   *
   * **Diagnostic**: An entity exposing some configuration parameter, or diagnostics of a device.
   */
  entity_category?: "config" | "diagnostic";
  /**
   * Default name to provide for the entity
   */
  name: string;
  translation_key?: string;
  attributes?: ATTRIBUTES;
};

export const isCommonConfigKey = <ATTRIBUTES extends object = object>(
  key: string,
): key is keyof EntityConfigCommon<ATTRIBUTES> => COMMON_CONFIG_KEYS.has(key);

export type SettableConfiguration<TYPE extends unknown> = TYPE | ReactiveConfig<TYPE>;

export type ReactiveConfig<TYPE extends unknown = unknown> = {
  /**
   * Update immediately in response to entity updates
   */
  onUpdate?: { onUpdate: (callback: () => TBlackHole) => void }[];

  /**
   * Every 30s by default
   */
  schedule?: CronExpression | string;

  /**
   * Calculate current value
   */
  current(): TYPE;
};

export const isReactiveConfig = (key: string, value: unknown): value is ReactiveConfig =>
  is.object(value) &&
  is.function((value as { current: () => void }).current) &&
  key !== "attributes" &&
  !NO_LIVE_UPDATE.has(key);

export const NO_LIVE_UPDATE = new Set<string>([
  "device_class",
  "device_id",
  "entity_category",
  "managed",
  "name",
  "suggested_object_id",
  "translation_key",
  "unique_id",
]);

export const COMMON_CONFIG_KEYS = new Set([
  "attributes",
  "device_id",
  "entity_category",
  "icon",
  "name",
  "suggested_object_id",
  "translation_key",
  "unique_id",
]);

export type NON_SETTABLE =
  | "managed"
  | "suggested_object_id"
  | "unique_id"
  | "device_id"
  | "device_class"
  | "translation_key"
  | "entity_category";

export type NonReactive<CONFIGURATION extends object> = {
  [KEY in Extract<keyof CONFIGURATION, string>]: CONFIGURATION[KEY] extends SettableConfiguration<
    infer TYPE
  >
    ? TYPE
    : CONFIGURATION[KEY];
};

export type CommonMethods<CONFIGURATION extends object> = {
  getEntity: () => ByIdProxy<PICK_ENTITY>;
  onUpdate(callback: TEntityUpdateCallback<PICK_ENTITY>): {
    remove(): void;
  };
  storage: TSynapseEntityStorage<CONFIGURATION & EntityConfigCommon<object>>;
};

/**
 * Synapse pro
 */
type ProxyBase<
  CONFIGURATION extends object,
  EVENT_MAP extends TEventMap,
  ATTRIBUTES extends object,
> = CommonMethods<CONFIGURATION> &
  NonReactive<CONFIGURATION> &
  BuildCallbacks<EVENT_MAP> &
  EntityConfigCommon<ATTRIBUTES>;

/**
 * The combination of all properties that went in, minus those that don't play well with runtime updates
 *
 * That is also enforced
 */
export type SynapseEntityProxy<
  CONFIGURATION extends object,
  EVENT_MAP extends TEventMap,
  ATTRIBUTES extends object,
  PROXY = ProxyBase<CONFIGURATION, EVENT_MAP, ATTRIBUTES>,
> = Except<PROXY, Extract<keyof PROXY, NON_SETTABLE>>;

export type BuildCallbacks<EVENT_MAP extends TEventMap> = {
  [EVENT_NAME in Extract<
    keyof EVENT_MAP,
    string
  > as CamelCase<`on-${EVENT_NAME}`>]: CreateRemovableCallback<EVENT_MAP[EVENT_NAME]>;
};
