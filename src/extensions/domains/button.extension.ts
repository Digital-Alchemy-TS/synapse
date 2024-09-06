import { TServiceParams } from "@digital-alchemy/core";
import { ButtonDeviceClass } from "@digital-alchemy/hass";

import { AddEntityOptions, BasicAddParams } from "../..";

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

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      ButtonConfiguration,
      ButtonEvents,
      PARAMS["Attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
