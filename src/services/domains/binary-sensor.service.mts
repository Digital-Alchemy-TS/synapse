import { TServiceParams } from "@digital-alchemy/core";
import { BinarySensorDeviceClass, ByIdProxy, PICK_ENTITY } from "@digital-alchemy/hass";

import {
  AddEntityOptions,
  BasicAddParams,
  CallbackData,
  SettableConfiguration,
  SynapseEntityProxy,
} from "../../helpers/index.mts";

export type BinarySensorConfiguration<DATA extends object> = {
  /**
   * Type of binary sensor.
   */
  device_class?: `${BinarySensorDeviceClass}`;
  /**
   * If the binary sensor is currently on or off.
   */
  is_on?: SettableConfiguration<boolean, DATA>;
};

export type BinarySensorEvents = {
  //
};

/**
 * Convenient type for binary sensor entities with optional attributes and locals
 */
export type SynapseBinarySensor<
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  BinarySensorConfiguration<DATA>,
  BinarySensorEvents,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"binary_sensor">
> & {
  entity: ByIdProxy<PICK_ENTITY<"binary_sensor">>;
};

export function VirtualBinarySensor({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<BinarySensorConfiguration<object>, BinarySensorEvents>({
    context,
    default_config: { is_on: false },
    domain: "binary_sensor",
    load_config_keys: ["device_class", "is_on"],
  });

  return function <
    PARAMS extends BasicAddParams,
    DATA extends object = CallbackData<
      PARAMS["locals"],
      PARAMS["attributes"],
      BinarySensorConfiguration<object>
    >,
  >(
    options: AddEntityOptions<
      BinarySensorConfiguration<DATA>,
      BinarySensorEvents,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >,
  ): SynapseBinarySensor<PARAMS["attributes"], PARAMS["locals"], DATA> {
    // @ts-expect-error it's fine
    const entity = generate.addEntity<PARAMS["attributes"], PARAMS["locals"], DATA>(options);
    return entity as SynapseBinarySensor<PARAMS["attributes"], PARAMS["locals"], DATA>;
  };
}
