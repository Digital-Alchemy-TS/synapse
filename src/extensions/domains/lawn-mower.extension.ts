import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * Current activity.
   */
  activity?: "mowing" | "docked" | "paused" | "error";
  supported_features?: number;
};

type EntityEvents = {
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
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["start_mowing", "dock", "pause"],
    context,
    // @ts-expect-error its fine
    domain: "lawn_mower",
    load_config_keys: ["activity", "supported_features"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
