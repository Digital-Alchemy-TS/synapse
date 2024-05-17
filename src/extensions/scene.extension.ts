import { TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";

import { TSynapseId } from "../helpers";

type TScene = {
  exec: () => TBlackHole;
  context: TContext;
  icon?: string;
  name: string;
};

type HassSceneUpdateEvent = {
  event_type: "digital_alchemy_activate";
  data: { id: TSynapseId };
};

export function Scene({
  logger,
  hass,
  synapse,
  context,
  internal,
}: TServiceParams) {
  const registry = synapse.registry.create<TScene>({
    context,
    // @ts-expect-error fixme
    domain: "scene",
  });

  // ### Listen for socket events
  hass.socket.onEvent({
    context: context,
    event: "digital_alchemy_activate",
    exec({ data }: HassSceneUpdateEvent) {
      const item = registry.byId(data.id);
      if (!item) {
        return;
      }
      const { exec, name } = item;
      logger.trace({ name }, `scene activate service call`);
      setImmediate(async () => {
        await internal.safeExec(async () => await exec());
      });
    },
  });

  /**
   * ### Register a new scene
   *
   * Basically the same thing as a button
   */
  function create(entity: TScene) {
    registry.add(entity);
  }
  return create;
}
