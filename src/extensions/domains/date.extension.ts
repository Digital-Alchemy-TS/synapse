import { TServiceParams } from "@digital-alchemy/core";
import dayjs, { ConfigType, Dayjs } from "dayjs";

import {
  AddEntityOptions,
  BasicAddParams,
  BuildCallbacks,
  DateTimeConfiguration,
  EntityException,
  SettableConfiguration,
} from "../..";

type Year = `${number}${number}${number}${number}`;
type MD = `${number}${number}`;
/**
 * YYYY-MM-DD
 */
export type SynapseDateFormat = `${Year}-${MD}-${MD}`;

export type DateConfiguration = {
  /**
   * default: true
   */
  managed?: boolean;
} & DateSettable;

export type DateEvents<VALUE extends SerializeTypes = SynapseDateFormat> = {
  set_value: { value: VALUE };
};

type TypeOptions = "dayjs" | "date" | "iso";

type DateParams = BasicAddParams & {
  date_type?: TypeOptions;
};
type SerializeTypes = SynapseDateFormat | Date | Dayjs;

type DateSettable =
  | { date_type?: "iso"; native_value?: SettableConfiguration<SynapseDateFormat> }
  | { date_type: "dayjs"; native_value?: SettableConfiguration<Dayjs> }
  | { date_type: "date"; native_value?: SettableConfiguration<Date> };

const FORMAT = "YYYY-MM-DD";

type CallbackType<D extends TypeOptions = "iso"> = D extends "dayjs"
  ? Dayjs
  : D extends "date"
    ? Date
    : SynapseDateFormat;

export function VirtualDate({ context, synapse, logger }: TServiceParams) {
  // #MARK: generator
  const generate = synapse.generator.create<DateConfiguration, DateEvents, SerializeTypes>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "date",
    load_config_keys: ["native_value"],
    serialize(property: keyof DateConfiguration, data: SerializeTypes) {
      if (property !== "native_value") {
        return data as string;
      }
      return dayjs(data).format(FORMAT);
    },
    unserialize(
      property: keyof DateTimeConfiguration,
      data: string,
      options: DateTimeConfiguration,
    ): SerializeTypes {
      if (property !== "native_value") {
        return data as SerializeTypes;
      }
      const ref = dayjs(data).startOf("day");
      switch (options.date_type) {
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
    validate(current: DateConfiguration, key: keyof DateConfiguration, newValue: unknown) {
      if (key !== "native_value") {
        return true;
      }
      const incoming = dayjs(newValue as ConfigType);
      if (incoming.isValid()) {
        return true;
      }
      logger.error({ expected: current.date_type || "ISO8601", newValue }, "unknown value type");
      throw new EntityException(context, "INVALID_DATE", `Received invalid date format`);
    },
  });

  // #MARK: builder
  return function <PARAMS extends DateParams>({
    managed = true,
    ...options
  }: AddEntityOptions<DateConfiguration, DateEvents, PARAMS["attributes"], PARAMS["locals"]>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onSetValue(({ value }) => entity.storage.set("native_value", value));
    }

    type DynamicCallbacks = BuildCallbacks<DateEvents<CallbackType<PARAMS["date_type"]>>>;
    type TypedVirtualDate = Omit<typeof entity, keyof DynamicCallbacks | "native_value"> &
      DynamicCallbacks & { native_value: CallbackType<PARAMS["date_type"]> };

    return entity as TypedVirtualDate;
  };
}
