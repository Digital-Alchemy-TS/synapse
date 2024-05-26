import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseUpdateParams = BaseEntityParams<never> &
  UpdateConfiguration & {
    install?: RemovableCallback<{ backup?: boolean; version?: string }>;
  };

export type UpdateConfiguration = EntityConfigCommon & {
  /**
   * The device or service that the entity represents has auto update logic.
   * When this is set to `true` you can not skip updates.
   */
  auto_update?: boolean;
  device_class?: "firmware";
  /**
   * Update installation progress.
   * Can either return a boolean (True if in progress, False if not) or an integer to indicate the progress from 0 to 100%.
   */
  in_progress?: boolean | number;
  /**
   * The currently installed and used version of the software.
   */
  installed_version?: string;
  /**
   * The latest version of the software available.
   */
  latest_version?: string;
  release_notes?: string;
  /**
   * Summary of the release notes or changelog.
   * This is not suitable for long changelogs but merely suitable for a short excerpt update description of max 255 characters.
   */
  release_summary?: string;
  /**
   * URL to the full release notes of the latest version available.
   */
  release_url?: string;
  supported_features?: number;
  /**
   * Title of the software. This helps to differentiate between the device or entity name versus the title of the software installed.
   */
  title?: string;
};

export type SynapseVirtualUpdate = BaseVirtualEntity<
  never,
  object,
  UpdateConfiguration
> & {
  onInstall: CreateRemovableCallback<{ backup?: boolean; version?: string }>;
};
