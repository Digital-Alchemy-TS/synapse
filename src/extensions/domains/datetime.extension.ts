import { is, TServiceParams } from "@digital-alchemy/core";
import dayjs, { Dayjs } from "dayjs";

import {
  AddEntityOptions,
  BasicAddParams,
  BuildCallbacks,
  EntityException,
  SettableConfiguration,
} from "../..";

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

export type DateTimeEvents<VALUE extends string | Dayjs | Date = string> = {
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
  // ? new Date("invalid date string").getTime() === NaN
  // #MARK: serialize
  const serialize = {
    date(property: keyof DateTimeConfiguration, data: SerializeTypes) {
      data = is.undefined(data) ? new Date() : data;
      if (is.number(data) || is.string(data)) {
        logger.warn({ data, property }, `expected [Date] received unexpected type`);
        data = new Date(data);
      }
      if (data instanceof dayjs) {
        return data.toISOString();
      }
      if (is.date(data) && is.number(data.getTime())) {
        return data.toISOString();
      }
      throw new EntityException(
        context,
        "INVALID_DATE",
        `Provided an invalid date to datetime entity`,
      );
    },
    dayjs(property: keyof DateTimeConfiguration, data: SerializeTypes) {
      if (is.number(data) || is.string(data) || is.date(data) || is.undefined(data)) {
        logger.warn({ data, property }, `expected [dayjs] received unexpected type`);
        data = dayjs(data);
      }
      if (data instanceof dayjs) {
        return data.toISOString();
      }
      throw new EntityException(
        context,
        "INVALID_DATE",
        `Provided an invalid dayjs to datetime entity`,
      );
    },
    iso(property: keyof DateTimeConfiguration, data: SerializeTypes) {
      if (is.number(data)) {
        logger.warn({ data, property }, `expected [iso string] received unexpected type`);
        return new Date(data).toISOString();
      }
      if (is.undefined(data)) {
        data = new Date();
      }
      if (is.date(data) || data instanceof dayjs) {
        logger.warn({ data, property }, `expected [iso string] received unexpected type`);
        return data.toISOString();
      }
      if (is.string(data) && is.number(new Date(data).getTime())) {
        return data;
      }
      throw new EntityException(
        context,
        "INVALID_DATE",
        `Provided an invalid date to datetime entity`,
      );
    },
  };

  // #MARK: generator
  const generate = synapse.generator.create<DateTimeConfiguration, DateTimeEvents, SerializeTypes>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "datetime",
    load_config_keys: ["native_value"],
    serialize(
      property: keyof DateTimeConfiguration,
      data: SerializeTypes,
      options: DateTimeConfiguration,
    ) {
      if (property !== "native_value") {
        return data as string;
      }
      switch (options.date_type) {
        case "dayjs": {
          return serialize.dayjs(property, data);
        }
        case "date": {
          return serialize.date(property, data);
        }
        default: {
          return serialize.iso(property, data);
        }
      }
    },
    unserialize(
      property: keyof DateTimeConfiguration,
      data: string,
      options: DateTimeConfiguration,
    ): SerializeTypes {
      if (property !== "native_value") {
        return data as SerializeTypes;
      }
      switch (options.date_type) {
        case "dayjs": {
          return dayjs(data);
        }
        case "date": {
          return data ? new Date(data) : new Date();
        }
        default: {
          return data ? String(data) : new Date().toISOString();
        }
      }
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
