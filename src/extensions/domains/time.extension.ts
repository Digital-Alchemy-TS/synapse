import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams, SettableConfiguration } from "../..";

export type SynapseTimeFormat = `${number}${number}:${number}${number}:${number}${number}`;

export type TimeConfiguration = {
  native_value?: SettableConfiguration<SynapseTimeFormat>;

  /**
   * default: true
   */
  managed?: boolean;
};

export type TimeEvents = {
  set_value: { value: SynapseTimeFormat };
};

export function VirtualTime({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<TimeConfiguration, TimeEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "time",
    load_config_keys: ["native_value"],
    map_state: "native_value",
  });

  return function <PARAMS extends BasicAddParams>({
    managed = true,
    ...options
  }: AddEntityOptions<TimeConfiguration, TimeEvents, PARAMS["attributes"], PARAMS["locals"]>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onSetValue(({ value }) => entity.storage.set("native_value", value));
    }
    return entity;
  };
}
