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

export function VirtualDateTime({ context, synapse }: TServiceParams) {
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
      if (is.undefined(data)) {
        return new Date().toISOString();
      }
      if (is.number(data) || is.string(data)) {
        data = new Date(data);
      }
      if (is.date(data) && is.number(data.getTime())) {
        return data.toISOString();
      }
      if (is.dayjs(data)) {
        return data.toISOString();
      }
      throw new EntityException(
        context,
        "INVALID_DATE",
        `Provided an invalid value to datetime entity`,
      );
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
