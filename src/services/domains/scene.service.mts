import type { TServiceParams } from "@digital-alchemy/core";
import type { ByIdProxy, PICK_ENTITY } from "@digital-alchemy/hass";
import type { EmptyObject } from "type-fest";

import type {
  AddEntityOptions,
  BasicAddParams,
  CallbackData,
  SynapseEntityProxy,
} from "../../helpers/index.mts";

export type SceneConfiguration = EmptyObject;

export type SceneEvents = {
  activate: EmptyObject;
};

/**
 * Convenient type for scene entities with optional attributes and locals
 */
export type SynapseScene<
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  SceneConfiguration,
  SceneEvents,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"scene">
> & {
  entity: ByIdProxy<PICK_ENTITY<"scene">>;
};

export function VirtualScene({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<SceneConfiguration, SceneEvents>({
    bus_events: ["activate"],
    context,
    domain: "scene",
  });

  return <
    PARAMS extends BasicAddParams,
    DATA extends object = CallbackData<PARAMS["locals"], PARAMS["attributes"], SceneConfiguration>,
  >(
    options: AddEntityOptions<
      SceneConfiguration,
      SceneEvents,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >,
  ): SynapseScene<PARAMS["attributes"], PARAMS["locals"], DATA> => {
    const entity = generate.addEntity(options);
    return entity as SynapseScene<PARAMS["attributes"], PARAMS["locals"], DATA>;
  };
}
