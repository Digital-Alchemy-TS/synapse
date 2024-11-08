import { TServiceParams } from "@digital-alchemy/core";
import { EmptyObject } from "type-fest";

import { AddEntityOptions, BasicAddParams } from "../..";

export type SceneConfiguration = EmptyObject;

export type SceneEvents = {
  activate: EmptyObject;
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
      PARAMS["attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
