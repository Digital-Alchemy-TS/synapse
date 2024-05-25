import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import { Dayjs } from "dayjs";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
import { TSynapseId } from "../utility.helper";

export type TImage<
  STATE extends ImageValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & ImageConfiguration;

// /**
//  * The content-type of the image, set automatically if the image entity provides a URL.
//  *
//  * > **Default**: `image/jpeg`
//  */
// content_type?: string;
// /**
//  * Timestamp of when the image was last updated. Used to determine `state`.
//  * Frontend will call image or `async_image` after this changes.
//  *
//  * > Automatically managed with url updates
//  */
// image_last_updated?: Date;

export type ImageConfiguration = EntityConfigCommon & {
  image_url: string;
};

export type ImageValue = Dayjs;

export const IMAGE_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "image_url",
] as (keyof ImageConfiguration)[];

export type HassImageEvent = { data: { unique_id: TSynapseId } };

export type TVirtualImage<
  STATE extends ImageValue = ImageValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends ImageConfiguration = ImageConfiguration,
  // @ts-expect-error its fine
  ENTITY_ID extends PICK_ENTITY<"image"> = PICK_ENTITY<"image">,
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
  onUpdate: UpdateCallback<ENTITY_ID>;
  /**
   * the current state
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};
