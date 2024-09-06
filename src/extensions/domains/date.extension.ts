import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../..";

type Year = `${number}${number}${number}${number}`;
type MD = `${number}${number}`;
/**
 * YYYY-MM-DD
 */
export type SynapseDateFormat = `${Year}-${MD}-${MD}`;

export type DateConfiguration = {
  native_value?: SettableConfiguration<SynapseDateFormat>;
  /**
   * default: true
   */
  managed?: boolean;
};

export type DateEvents = {
  set_value: { value: SynapseDateFormat };
};

export function VirtualDate({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<DateConfiguration, DateEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "date",
    load_config_keys: ["native_value"],
    map_state: "native_value",
  });

  return function <PARAMS extends BasicAddParams>({
    managed = true,
    ...options
  }: AddEntityOptions<DateConfiguration, DateEvents, PARAMS["attributes"], PARAMS["locals"]>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onSetValue(({ value }) => entity.storage.set("native_value", value));
    }
    return entity;
  };
}
