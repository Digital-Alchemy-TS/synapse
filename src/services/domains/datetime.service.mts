import type { TServiceParams } from "@digital-alchemy/core";
import type { ByIdProxy, PICK_ENTITY } from "@digital-alchemy/hass";
import type { ConfigType, Dayjs } from "dayjs";
import dayjs from "dayjs";

import type {
  AddEntityOptions,
  BasicAddParams,
  CallbackData,
  SettableConfiguration,
  SynapseEntityProxy,
} from "../../helpers/index.mts";
import { SynapseEntityException } from "../../helpers/index.mts";

export type DateTimeConfiguration<DATA extends object, DATE_TYPE extends TypeOptions = "iso"> = {
  /**
   * default: true
   */
  managed?: boolean;
  date_type?: DATE_TYPE;
  native_value?: SettableConfiguration<CallbackType<DATE_TYPE>, DATA>;
};

export type DateTimeEvents<VALUE extends SerializeTypes = string> = {
  set_value: { value: VALUE };
};

type TypeOptions = "dayjs" | "date" | "iso";

type DateTimeParams = BasicAddParams & {
  date_type?: TypeOptions;
};

type CallbackType<D extends TypeOptions = "iso"> = D extends "dayjs"
  ? Dayjs
  : D extends "date"
    ? Date
    : string;

/**
 * Convenient type for datetime entities with optional attributes and locals
 */
export type SynapseDateTime<
  DATE_TYPE extends TypeOptions,
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  DateTimeConfiguration<DATA, DATE_TYPE>,
  DateTimeEvents,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"datetime">
> & {
  entity: ByIdProxy<PICK_ENTITY<"datetime">>;
};

type SerializeTypes = string | Date | Dayjs;

export function VirtualDateTime({ context, synapse, logger }: TServiceParams) {
  // #MARK: generator
  const generate = synapse.generator.create<
    DateTimeConfiguration<object>,
    DateTimeEvents,
    SerializeTypes
  >({
    bus_events: ["set_value"],
    context,
    domain: "datetime",
    load_config_keys: ["native_value"],
    serialize(property: keyof DateTimeConfiguration<object>, data: SerializeTypes) {
      if (property !== "native_value") {
        return data as string;
      }
      return dayjs(data).toISOString();
    },
    unserialize(
      property: keyof DateTimeConfiguration<object>,
      data: string,
      options: DateTimeConfiguration<object>,
    ): SerializeTypes {
      if (property !== "native_value") {
        return data as SerializeTypes;
      }
      const ref = dayjs(data);
      switch (options.date_type as TypeOptions) {
        case "dayjs": {
          return ref;
        }
        case "date": {
          return ref.toDate();
        }
        default: {
          return ref.toISOString();
        }
      }
    },
    validate(
      current: DateTimeConfiguration<object>,
      key: keyof DateTimeConfiguration<object>,
      newValue: unknown,
    ) {
      if (key !== "native_value") {
        return true;
      }
      const incoming = dayjs(newValue as ConfigType);
      if (incoming.isValid()) {
        return true;
      }
      logger.error({ expected: current.date_type || "iso", newValue }, "unknown value type");
      throw new SynapseEntityException(
        context,
        "SET_INVALID_DATETIME",
        `Received invalid datetime format`,
      );
    },
  });

  // #MARK: builder
  return function <
    DATE_TYPE extends TypeOptions,
    PARAMS extends DateTimeParams & { date_type: DATE_TYPE },
    DATA extends object = CallbackData<PARAMS["locals"], PARAMS["attributes"]>,
  >(
    options: AddEntityOptions<
      DateTimeConfiguration<DATA, DATE_TYPE>,
      DateTimeEvents,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >,
  ): SynapseDateTime<DATE_TYPE, PARAMS["attributes"], PARAMS["locals"], DATA> {
    const { managed = true, ...entityOptions } = options;

    // // Set default value based on date_type
    // if (!entityOptions.native_value) {
    //   const now = dayjs();
    //   switch (entityOptions.date_type) {
    //     case "dayjs":
    //       entityOptions.native_value = now as CallbackType<DATE_TYPE>;
    //       break;
    //     case "date":
    //       entityOptions.native_value = now.toDate() as CallbackType<DATE_TYPE>;
    //       break;
    //     default:
    //       entityOptions.native_value = now.toISOString() as CallbackType<DATE_TYPE>;
    //       break;
    //   }
    // }

    // @ts-expect-error it's fine
    const entity = generate.addEntity<PARAMS["attributes"], PARAMS["locals"], DATA>(entityOptions);
    if (managed) {
      entity.onSetValue(({ value }) => {
        logger.trace({ value }, "[managed] onSetValue");
        void entity.storage.set("native_value", value);
      });
    }

    return entity as unknown as SynapseDateTime<
      DATE_TYPE,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >;
  };
}
