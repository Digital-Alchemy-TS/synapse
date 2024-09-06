import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams } from "../..";

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

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      SceneConfiguration,
      SceneEvents,
      PARAMS["Attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
