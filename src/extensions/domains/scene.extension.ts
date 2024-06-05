import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

export type SceneConfiguration = {
  //
};

export type SceneEvents = {
  activate: {
    //
  };
};

export function VirtualScene({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<SceneConfiguration, SceneEvents>({
    bus_events: ["activate"],
    context,
    domain: "scene",
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<SceneConfiguration, SceneEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
