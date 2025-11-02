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

type Year = `${number}${number}${number}${number}`;
type MD = `${number}${number}`;
/**
 * YYYY-MM-DD
 */
export type SynapseDateFormat = `${Year}-${MD}-${MD}`;

export type DateConfiguration<DATA extends object, DATE_TYPE extends TypeOptions = "iso"> = {
  /**
   * default: true
   */
  managed?: boolean;
  date_type?: DATE_TYPE;
  native_value?: SettableConfiguration<CallbackType<DATE_TYPE>, DATA>;
};

export type DateEvents<VALUE extends SerializeTypes = SynapseDateFormat> = {
  set_value: { value: VALUE };
};

type TypeOptions = "dayjs" | "date" | "iso";

type DateParams = BasicAddParams & {
  date_type?: TypeOptions;
};
type SerializeTypes = SynapseDateFormat | Date | Dayjs;

const FORMAT = "YYYY-MM-DD";

type CallbackType<D extends TypeOptions = "iso"> = D extends "dayjs"
  ? Dayjs
  : D extends "date"
    ? Date
    : SynapseDateFormat;

/**
 * Convenient type for date entities with optional attributes and locals
 */
export type SynapseDate<
  DATE_TYPE extends TypeOptions,
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  DateConfiguration<DATA, DATE_TYPE>,
  DateEvents,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"date">
> & {
  entity: ByIdProxy<PICK_ENTITY<"date">>;
};

export function VirtualDate({ context, synapse, logger }: TServiceParams) {
  // #MARK: generator
  const generate = synapse.generator.create<DateConfiguration<object>, DateEvents, SerializeTypes>({
    bus_events: ["set_value"],
    context,
    domain: "date",
    load_config_keys: ["native_value"],
    serialize(property: keyof DateConfiguration<object>, data: SerializeTypes) {
      if (property !== "native_value") {
        return data as string;
      }
      return dayjs(data).format(FORMAT);
    },
    unserialize(
      property: keyof DateConfiguration<object>,
      data: string,
      options: DateConfiguration<object>,
    ): SerializeTypes {
      if (property !== "native_value") {
        return data as SerializeTypes;
      }
      const ref = dayjs(data).startOf("day");
      switch (options.date_type as TypeOptions) {
        case "dayjs": {
          return ref;
        }
        case "date": {
          return ref.toDate();
        }
        default: {
          return ref.format(FORMAT) as SynapseDateFormat;
        }
      }
    },
    validate(
      current: DateConfiguration<object>,
      key: keyof DateConfiguration<object>,
      newValue: unknown,
    ) {
      if (key !== "native_value") {
        return true;
      }
      const incoming = dayjs(newValue as ConfigType);
      if (incoming.isValid()) {
        return true;
      }
      logger.error({ expected: current.date_type || "ISO8601", newValue }, "unknown value type");
      throw new SynapseEntityException(context, "SET_INVALID_DATE", `Received invalid date format`);
    },
  });

  // #MARK: builder
  return function <
    DATE_TYPE extends TypeOptions,
    PARAMS extends DateParams & { date_type: DATE_TYPE },
    DATA extends object = CallbackData<
      PARAMS["locals"],
      PARAMS["attributes"],
      DateConfiguration<object>
    >,
  >(
    options: AddEntityOptions<
      DateConfiguration<DATA, DATE_TYPE>,
      DateEvents,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >,
  ): SynapseDate<DATE_TYPE, PARAMS["attributes"], PARAMS["locals"], DATA> {
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
    //       entityOptions.native_value = now.format(FORMAT) as CallbackType<DATE_TYPE>;
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

    return entity as unknown as SynapseDate<
      DATE_TYPE,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >;
  };
}
