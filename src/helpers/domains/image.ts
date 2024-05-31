import { Dayjs } from "dayjs";

import { BaseEntityParams, BaseVirtualEntity } from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseImageParams = BaseEntityParams<ImageStates> & ImageConfiguration;

type ImageStates = "opening" | "open" | "closing" | "closed";

export type ImageConfiguration = EntityConfigCommon & {
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

export type SynapseVirtualImage = BaseVirtualEntity<ImageStates, object, ImageConfiguration>;
