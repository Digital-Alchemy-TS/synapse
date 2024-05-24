import { TAreaId } from "@digital-alchemy/hass";

export type EntityConfigCommon = {
  /**
   * Area to provide the entity in
   */
  area_id?: TAreaId;
  /**
   * Attempt to create the entity id using this string
   *
   * `binary_sensor.{suggested id}`
   *
   * Home assistant _may_ append numbers to the end in case of object_id conflicts where `unique_id` isn't the same.
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
};

export const BASE_CONFIG_KEYS = [
  "area_id",
  "suggested_object_id",
  "unique_id",
  "icon",
  "entity_category",
];
