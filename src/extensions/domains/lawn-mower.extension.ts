import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type LawnMowerConfiguration = {
  /**
   * Current activity.
   */
  activity?: SettableConfiguration<"mowing" | "docked" | "paused" | "error">;
  supported_features?: number;
};

export type LawnMowerEvents = {
  start_mowing: {
    //
  };
  dock: {
    //
  };
  pause: {
    //
  };
};

export function VirtualLawnMower({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<LawnMowerConfiguration, LawnMowerEvents>({
    bus_events: ["start_mowing", "dock", "pause"],
    context,
    // @ts-expect-error its fine
    domain: "lawn_mower",
    load_config_keys: ["activity", "supported_features"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<LawnMowerConfiguration, LawnMowerEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
