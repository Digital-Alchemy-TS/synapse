import { TServiceParams } from "@digital-alchemy/core";
import dayjs, { ConfigType, Dayjs } from "dayjs";

import {
  AddEntityOptions,
  BasicAddParams,
  BuildCallbacks,
  SettableConfiguration,
  SynapseEntityException,
} from "../../helpers/index.mts";

type DateTimeSettable =
  | {
      date_type?: "iso";
      /**
       * iso date string
       */
      native_value?: SettableConfiguration<string>;
    }
  | {
      date_type: "dayjs";
      native_value?: SettableConfiguration<Dayjs>;
    }
  | {
      date_type: "date";
      native_value?: SettableConfiguration<Date>;
    };

export type DateTimeConfiguration = {
  /**
   * default: true
   */
  managed?: boolean;
} & DateTimeSettable;

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

type SerializeTypes = string | Date | Dayjs;

export function VirtualDateTime({ context, synapse, logger }: TServiceParams) {
  // #MARK: generator
  const generate = synapse.generator.create<DateTimeConfiguration, DateTimeEvents, SerializeTypes>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "datetime",
    load_config_keys: ["native_value"],
    serialize(property: keyof DateTimeConfiguration, data: SerializeTypes) {
      if (property !== "native_value") {
        return data as string;
      }
      return dayjs(data).toISOString();
    },
    unserialize(
      property: keyof DateTimeConfiguration,
      data: string,
      options: DateTimeConfiguration,
    ): SerializeTypes {
      if (property !== "native_value") {
        return data as SerializeTypes;
      }
      const ref = dayjs(data);
      switch (options.date_type) {
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
    validate(current: DateTimeConfiguration, key: keyof DateTimeConfiguration, newValue: unknown) {
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
  return function <PARAMS extends DateTimeParams>({
    managed = true,
    ...options
  }: AddEntityOptions<
    DateTimeConfiguration,
    DateTimeEvents,
    PARAMS["attributes"],
    PARAMS["locals"]
  >) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onSetValue(({ value }) => entity.storage.set("native_value", value));
    }
    type DynamicCallbacks = BuildCallbacks<DateTimeEvents<CallbackType<PARAMS["date_type"]>>>;
    type TypedVirtualDateTime = Omit<typeof entity, keyof DynamicCallbacks | "native_value"> &
      DynamicCallbacks & { native_value: CallbackType<PARAMS["date_type"]> };

    return entity as TypedVirtualDateTime;
  };
}
