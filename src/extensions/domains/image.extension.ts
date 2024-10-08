import { TServiceParams } from "@digital-alchemy/core";
import { Dayjs } from "dayjs";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../..";

export type ImageConfiguration = {
  /**
   * The content-type of the image, set automatically if the image entity provides a URL.
   */
  content_type?: SettableConfiguration<string>;
  /**
   * Timestamp of when the image was last updated. Used to determine state. Frontend will call image or async_image after this changes.
   */
  image_last_updated?: SettableConfiguration<Dayjs>;
  /**
   * Optional URL from where the image should be fetched.
   */
  image_url?: SettableConfiguration<string>;
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

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      ImageConfiguration,
      ImageEvents,
      PARAMS["attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
