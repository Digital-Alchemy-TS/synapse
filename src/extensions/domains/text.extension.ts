import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * Defines how the text should be displayed in the UI. Can be text or password.
   */
  mode?: "text" | "password";
  /**
   * The maximum number of characters in the text value (inclusive).
   */
  native_max?: number;
  /**
   * The minimum number of characters in the text value (inclusive).
   */
  native_min?: number;
  /**
   * A regex pattern that the text value must match to be valid.
   */
  pattern?: string;
  /**
   * The value of the text.
   */
  native_value?: string;
};

type EntityEvents = {
  set_value: { value: string };
};

export function VirtualText({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "text",
    load_config_keys: ["mode", "native_max", "native_min", "pattern", "native_value"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
