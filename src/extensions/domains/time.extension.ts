import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

export type SynapseTimeFormat = `${number}${number}:${number}${number}:${number}${number}`;

type EntityConfiguration = {
  native_value?: SynapseTimeFormat;

  /**
   * default: true
   */
  managed?: boolean;
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
    map_state: "native_value",
  });

  return function <ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>) {
    const entity = generate.add_entity(options);
    if (managed) {
      entity.onSetValue(({ value }) => entity.storage.set("native_value", value));
    }
    return entity;
  };
}
