import type { TServiceParams } from "@digital-alchemy/core";
import type { ButtonDeviceClass, ByIdProxy, PICK_ENTITY } from "@digital-alchemy/hass";

import type {
  AddEntityOptions,
  BasicAddParams,
  CallbackData,
  SynapseEntityProxy,
} from "../../helpers/index.mts";

export type ButtonConfiguration = {
  device_class?: `${ButtonDeviceClass}`;
};

export type ButtonEvents = {
  press: {};
};

/**
 * Convenient type for button entities with optional attributes and locals
 */
export type SynapseButton<
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  ButtonConfiguration,
  ButtonEvents,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"button">
> & {
  entity: ByIdProxy<PICK_ENTITY<"button">>;
};

export function VirtualButton({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<ButtonConfiguration, ButtonEvents>({
    bus_events: ["press"],
    context,
    domain: "button",
    load_config_keys: ["device_class"],
  });

  return <
    PARAMS extends BasicAddParams,
    DATA extends object = CallbackData<PARAMS["locals"], PARAMS["attributes"], ButtonConfiguration>,
  >(
    options: AddEntityOptions<
      ButtonConfiguration,
      ButtonEvents,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >,
  ): SynapseButton<PARAMS["attributes"], PARAMS["locals"], DATA> => {
    const entity = generate.addEntity(options);
    return entity as SynapseButton<PARAMS["attributes"], PARAMS["locals"], DATA>;
  };
}
