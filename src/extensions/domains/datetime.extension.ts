import { TServiceParams } from "@digital-alchemy/core";
import dayjs, { Dayjs } from "dayjs";

import {
  AddEntityOptions,
  BasicAddParams,
  BuildCallbacks,
  SelectConfiguration,
  SelectEvents,
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

export function VirtualDateTime({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<DateTimeConfiguration, DateTimeEvents>({
    bus_events: ["set_value"],
    context,
    // @ts-expect-error its fine
    domain: "datetime",
    load_config_keys: ["native_value"],
    map_state: "native_value",
  });

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
