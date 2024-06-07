import { TServiceParams } from "@digital-alchemy/core";
import { Dayjs } from "dayjs";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type DateTimeConfiguration = {
  /**
   * iso date string
   *
   * will translate Dayjs objects to correctly formatted strings
   */
  native_value?: SettableConfiguration<string | Dayjs>;
  /**
   * default: true
   */
  managed?: boolean;
};

export type DateTimeEvents = {
  set_value: { value: string };
};

export function VirtualDateTime({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<DateTimeConfiguration, DateTimeEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "datetime",
    load_config_keys: ["native_value"],
    map_state: "native_value",
  });

  return function <ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<DateTimeConfiguration, DateTimeEvents, ATTRIBUTES>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onSetValue(({ value }) => entity.storage.set("native_value", value));
    }
    return entity;
  };
}
