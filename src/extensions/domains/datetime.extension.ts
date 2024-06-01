import { TServiceParams } from "@digital-alchemy/core";
import { Dayjs } from "dayjs";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * iso date string
   *
   * will translate Dayjs objects to correctly formatted strings
   */
  native_value?: string | Dayjs;
};

type EntityEvents = {
  set_value: { value: string };
};

export function VirtualDateTime({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "datetime",
    load_config_keys: ["native_value"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
