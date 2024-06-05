import { CronExpression, is, TBlackHole } from "@digital-alchemy/core";

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
  icon?: string;
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
): key is keyof EntityConfigCommon<ATTRIBUTES> =>
  [
    "device_id",
    "suggested_object_id",
    "unique_id",
    "icon",
    "entity_category",
    "name",
    "translation_key",
    "attributes",
  ].includes(key);

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
  is.object(value) && key !== "attributes";
