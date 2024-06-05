import { TServiceParams } from "@digital-alchemy/core";
import { Dayjs } from "dayjs";

import { AddEntityOptions } from "../..";

export type ImageConfiguration = {
  /**
   * The content-type of the image, set automatically if the image entity provides a URL.
   */
  content_type?: string;
  /**
   * Timestamp of when the image was last updated. Used to determine state. Frontend will call image or async_image after this changes.
   */
  image_last_updated?: Dayjs;
  /**
   * Optional URL from where the image should be fetched.
   */
  image_url?: string;
};

export type ImageEvents = {
  //
};

export function VirtualImage({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<ImageConfiguration, ImageEvents>({
    bus_events: [],
    context,
    // @ts-expect-error its fine
    domain: "image",
    load_config_keys: ["content_type", "image_last_updated", "image_url"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<ImageConfiguration, ImageEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
