import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../..";

export type UpdateConfiguration = {
  /**
   * The device or service that the entity represents has auto update logic.
   * When this is set to `true` you can not skip updates.
   */
  auto_update?: SettableConfiguration<boolean>;
  device_class?: "firmware";
  /**
   * Update installation progress.
   * Can either return a boolean (True if in progress, False if not) or an integer to indicate the progress from 0 to 100%.
   */
  in_progress?: SettableConfiguration<boolean | number>;
  /**
   * The currently installed and used version of the software.
   */
  installed_version?: SettableConfiguration<string>;
  /**
   * The latest version of the software available.
   */
  latest_version?: SettableConfiguration<string>;
  /**
   * This method can be implemented so users can can get the full release notes in the more-info dialog of the Home Assistant Frontend before they install the update.
   *
   * The returned string can contain markdown, and the frontend will format that correctly.
   *
   * This method requires UpdateEntityFeature.RELEASE_NOTES to be set.
   */
  release_notes?: SettableConfiguration<string>;
  /**
   * Summary of the release notes or changelog.
   * This is not suitable for long changelogs but merely suitable for a short excerpt update description of max 255 characters.
   */
  release_summary?: SettableConfiguration<string>;
  /**
   * URL to the full release notes of the latest version available.
   */
  release_url?: SettableConfiguration<string>;
  supported_features?: number;
  /**
   * Title of the software. This helps to differentiate between the device or entity name versus the title of the software installed.
   */
  title?: SettableConfiguration<string>;
};

export type UpdateEvents = {
  install: { backup?: boolean; version?: string };
};

export function VirtualUpdate({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<UpdateConfiguration, UpdateEvents>({
    bus_events: ["install"],
    context,
    // @ts-expect-error its fine
    domain: "update",
    load_config_keys: [
      "auto_update",
      "device_class",
      "in_progress",
      "installed_version",
      "latest_version",
      "release_notes",
      "release_summary",
      "release_url",
      "supported_features",
      "title",
    ],
  });

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      UpdateConfiguration,
      UpdateEvents,
      PARAMS["Attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
