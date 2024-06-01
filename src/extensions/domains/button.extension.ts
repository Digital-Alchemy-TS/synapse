import { TServiceParams } from "@digital-alchemy/core";
import { ButtonDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  device_class?: `${ButtonDeviceClass}`;
};

type EntityEvents = {
  press: {
    //
  };
};

export function VirtualButton({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: ["press"],
    context,
    // @ts-expect-error its fine
    domain: "button",
    load_config_keys: ["device_class"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
