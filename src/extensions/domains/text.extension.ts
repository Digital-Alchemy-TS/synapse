import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type TextConfiguration = {
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
  pattern?: SettableConfiguration<string>;
  /**
   * The value of the text.
   */
  native_value?: SettableConfiguration<string>;
  /**
   * default: true
   */
  managed?: boolean;
};

export type TextEvents = {
  set_value: { value: string };
};

export function VirtualText({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<TextConfiguration, TextEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "text",
    load_config_keys: ["mode", "native_max", "native_min", "pattern", "native_value"],
    map_state: "native_value",
  });

  return function <LOCALS extends object, ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<TextConfiguration, TextEvents, ATTRIBUTES, LOCALS>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onSetValue(({ value }) => entity.storage.set("native_value", value));
    }
    return entity;
  };
}
