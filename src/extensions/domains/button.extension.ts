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
    // @ts-expect-error its fine
    domain: "button",
    load_config_keys: ["device_class"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<ButtonConfiguration, ButtonEvents, ATTRIBUTES>,
  ) => generate.addEntity(options);
}
