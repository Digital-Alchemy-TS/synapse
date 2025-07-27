import { TServiceParams } from "@digital-alchemy/core";
import { ByIdProxy, PICK_ENTITY } from "@digital-alchemy/hass";

import {
  AddEntityOptions,
  BasicAddParams,
  CallbackData,
  NumberDeviceClasses,
  NumberSensors,
  SettableConfiguration,
  SynapseEntityProxy,
} from "../../helpers/index.mts";

export type NumberConfiguration<DATA extends object> = Partial<
  NumberSensors<NumberDeviceClasses>
> & {
  /**
   * Defines how the number should be displayed in the UI.
   * It's recommended to use the default `auto`.
   * Can be `box` or `slider` to force a display mode.
   */
  mode?: SettableConfiguration<"auto" | "slider" | "box", DATA>;
  /**
   * The maximum accepted value in the number's native_unit_of_measurement (inclusive)
   */
  native_max_value?: number;
  /**
   * The minimum accepted value in the number's native_unit_of_measurement (inclusive)
   */
  native_min_value?: number;
  /**
   * Defines the resolution of the values, i.e. the smallest increment or decrement in the number's
   */
  step?: number;
  /**
   * The value of the number in the number's native_unit_of_measurement.
   */
  native_value?: SettableConfiguration<number, DATA>;
  /**
   * default: true
   */
  managed?: boolean;
};

export type NumberEvents = {
  set_value: { value: number };
};

/**
 * Convenient type for number entities with optional attributes and locals
 */
export type SynapseNumber<
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  NumberConfiguration<DATA>,
  NumberEvents,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"number">
> & {
  entity: ByIdProxy<PICK_ENTITY<"number">>;
};

export function VirtualNumber({ context, synapse, logger }: TServiceParams) {
  const generate = synapse.generator.create<NumberConfiguration<object>, NumberEvents>({
    bus_events: ["set_value"],
    context,
    domain: "number",
    load_config_keys: [
      "device_class",
      "unit_of_measurement",
      "mode",
      "native_max_value",
      "native_min_value",
      "step",
      "native_value",
    ],
  });

  return function <
    PARAMS extends BasicAddParams,
    DATA extends object = CallbackData<
      PARAMS["locals"],
      PARAMS["attributes"],
      NumberConfiguration<object>
    >,
  >({
    managed = true,
    ...options
  }: AddEntityOptions<
    NumberConfiguration<DATA>,
    NumberEvents,
    PARAMS["attributes"],
    PARAMS["locals"],
    DATA
  >): SynapseNumber<PARAMS["attributes"], PARAMS["locals"], DATA> {
    // @ts-expect-error it's fine
    const entity = generate.addEntity<PARAMS["attributes"], PARAMS["locals"], DATA>(options);

    if (managed) {
      entity.onSetValue(({ value }) => {
        logger.trace({ value }, "[managed] onSetValue");
        void entity.storage.set("native_value", value);
      });
    }
    return entity as SynapseNumber<PARAMS["attributes"], PARAMS["locals"], DATA>;
  };
}
