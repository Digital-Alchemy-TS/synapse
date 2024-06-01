import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  //
};

type EntityEvents = {
  send_message: {
    message: string;
    title?: string;
  };
};

export function VirtualNotify({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["send_message"],
    context,
    // @ts-expect-error its fine
    domain: "notify",
    load_config_keys: [],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
