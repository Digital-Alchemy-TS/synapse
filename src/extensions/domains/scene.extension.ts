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

  return <ATTRIBUTES extends object, LOCALS extends object>(
    options: AddEntityOptions<SceneConfiguration, SceneEvents, ATTRIBUTES, LOCALS>,
  ) => generate.addEntity(options);
}
