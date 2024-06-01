import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type Year = `${number}${number}${number}${number}`;
type MD = `${number}${number}`;
/**
 * YYYY-MM-DD
 */
export type SynapseDateFormat = `${Year}-${MD}-${MD}`;

type EntityConfiguration = {
  native_value?: SynapseDateFormat;
};

type EntityEvents = {
  set_value: { value: SynapseDateFormat };
};

export function VirtualDate({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "date",
    load_config_keys: ["native_value"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
