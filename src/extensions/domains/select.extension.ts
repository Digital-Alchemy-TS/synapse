import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * The current select option
   */
  current_option?: string;
  /**
   * A list of available options as strings
   */
  options?: string[];
};

type EntityEvents = {
  select: { option: string };
};

export function VirtualSelect({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["select"],
    context,
    // @ts-expect-error its fine
    domain: "select",
    load_config_keys: ["current_option", "options"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
