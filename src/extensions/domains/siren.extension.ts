import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type SirenConfiguration = {
  /**
   * Whether the device is on or off.
   */
  is_on?: SettableConfiguration<boolean>;
  /**
   * The list or dictionary of available tones on the device to pass into the turn_on service.
   * If a dictionary is provided, when a user uses the dict value of a tone,
   * it will get converted to the corresponding dict key before being passed on to the integration platform.
   * Requires SUPPORT_TONES feature.
   */
  available_tones?: string[];
  supported_features?: number;
};

export type SirenEvents = {
  turn_on: {
    //
  };
  turn_off: {
    //
  };
};

export function VirtualSiren({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<SirenConfiguration, SirenEvents>({
    bus_events: ["turn_on", "turn_off"],
    context,
    // @ts-expect-error its fine
    domain: "siren",
    load_config_keys: ["is_on", "available_tones", "supported_features"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<SirenConfiguration, SirenEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
