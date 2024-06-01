import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

export type SynapseTimeFormat = `${number}${number}:${number}${number}:${number}${number}`;

type EntityConfiguration = {
  native_value?: SynapseTimeFormat;
};

type EntityEvents = {
  set_value: { value: SynapseTimeFormat };
};

export function VirtualTime({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "time",
    load_config_keys: ["native_value"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
