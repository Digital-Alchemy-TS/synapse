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
  /**
   * default: true
   */
  managed?: boolean;
};

type EntityEvents = {
  select_option: { option: string };
};

export function VirtualSelect({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["select_option"],
    context,
    // @ts-expect-error its fine
    domain: "select",
    load_config_keys: ["current_option", "options"],
    map_state: "current_option",
  });

  return function <ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>) {
    const entity = generate.add_entity(options);
    if (managed) {
      entity.onSelectOption(({ option }) => entity.storage.set("current_option", option));
    }
    return entity;
  };
}
