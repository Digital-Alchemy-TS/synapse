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
