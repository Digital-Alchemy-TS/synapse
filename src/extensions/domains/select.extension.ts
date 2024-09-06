import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../..";

export type SelectConfiguration<OPTIONS extends string = string> = {
  /**
   * The current select option
   */
  current_option?: SettableConfiguration<OPTIONS>;
  /**
   * A list of available options as strings
   */
  options?: OPTIONS[];
  /**
   * default: true
   */
  managed?: boolean;
};

export type SelectEvents = {
  select_option: { option: string };
};

export function VirtualSelect({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<SelectConfiguration, SelectEvents>({
    bus_events: ["select_option"],
    context,
    // @ts-expect-error its fine
    domain: "select",
    load_config_keys: ["current_option", "options"],
    map_state: "current_option",
  });

  return function <PARAMS extends BasicAddParams>({
    managed = true,
    ...options
  }: AddEntityOptions<SelectConfiguration, SelectEvents, PARAMS["Attributes"], PARAMS["locals"]>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onSelectOption(({ option }) => entity.storage.set("current_option", option));
    }
    return entity;
  };
}
