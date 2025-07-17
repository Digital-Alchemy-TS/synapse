import { TServiceParams } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import dayjs from "dayjs";

import {
  AddEntityOptions,
  BasicAddParams,
  CallbackData,
  SettableConfiguration,
  SynapseEntityProxy,
} from "../../helpers/index.mts";

export type SynapseTimeFormat = `${number}${number}:${number}${number}:${number}${number}`;

export type TimeConfiguration<DATA extends object> = {
  native_value?: SettableConfiguration<SynapseTimeFormat, DATA>;

  /**
   * default: true
   */
  managed?: boolean;
};

export type TimeEvents = {
  set_value: { value: SynapseTimeFormat };
};

/**
 * Convenient type for time entities with optional attributes and locals
 */
export type SynapseTime<
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  TimeConfiguration<DATA>,
  TimeEvents,
  ATTRIBUTES,
  LOCALS,
  DATA,
  // @ts-expect-error ignore this
  PICK_ENTITY<"time">
>;

export function VirtualTime({ context, synapse, logger }: TServiceParams) {
  const generate = synapse.generator.create<TimeConfiguration<object>, TimeEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "time",
    load_config_keys: ["native_value"],
  });

  return function <
    PARAMS extends BasicAddParams,
    DATA extends object = CallbackData<
      PARAMS["locals"],
      PARAMS["attributes"],
      TimeConfiguration<object>
    >,
  >({
    managed = true,
    ...options
  }: AddEntityOptions<
    TimeConfiguration<DATA>,
    TimeEvents,
    PARAMS["attributes"],
    PARAMS["locals"],
    DATA
  >): SynapseTime<PARAMS["attributes"], PARAMS["locals"], DATA> {
    options.native_value ??= dayjs().format("HH:mm:ss") as SynapseTimeFormat;
    // @ts-expect-error it's fine
    const entity = generate.addEntity<PARAMS["attributes"], PARAMS["locals"], DATA>(options);
    if (managed) {
      entity.onSetValue(({ value }) => {
        logger.trace({ value }, "[managed] onSetValue");
        entity.storage.set("native_value", value);
      });
    }
    return entity as SynapseTime<PARAMS["attributes"], PARAMS["locals"], DATA>;
  };
}
