import { TServiceParams } from "@digital-alchemy/core";
import { ButtonDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions } from "../..";

export type ButtonConfiguration = {
  device_class?: `${ButtonDeviceClass}`;
};

export type ButtonEvents = {
  press: {
    //
  };
};

export function VirtualButton({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<ButtonConfiguration, ButtonEvents>({
    bus_events: ["press"],
    context,
    domain: "button",
    load_config_keys: ["device_class"],
  });

  return <LOCALS extends object = object, ATTRIBUTES extends object = object>(
    options: AddEntityOptions<ButtonConfiguration, ButtonEvents, ATTRIBUTES, LOCALS>,
  ) => generate.addEntity(options);
}
