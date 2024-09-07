import { is, NONE, TServiceParams } from "@digital-alchemy/core";
import dayjs, { Dayjs } from "dayjs";

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
  | {
      date_type?: "iso";
      /**
       * iso date string
       */
      native_value?: SettableConfiguration<SynapseDateFormat>;
    }
  | {
      date_type: "dayjs";
      native_value?: SettableConfiguration<Dayjs>;
    }
  | {
      date_type: "date";
      native_value?: SettableConfiguration<Date>;
    };

const FORMAT = "YYYY-MM-DD";
const expectedLength = FORMAT.length;

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
      if (is.undefined(data)) {
        return dayjs().format(FORMAT);
      }
      try {
        const ref = dayjs(data);
        if (!ref.isValid()) {
          throw new EntityException(
            context,
            "INVALID_DATE",
            `Provided an invalid value to datetime entity`,
          );
        }
        return ref.format(FORMAT);
      } catch (error) {
        logger.error({ error }, "failed");
        throw new EntityException(
          context,
          "INVALID_DATE",
          `Provided an invalid value to datetime entity`,
        );
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
          return dayjs(data).startOf("day");
        }
        case "date": {
          return dayjs(data).startOf("day").toDate();
        }
        default: {
          return dayjs(data).format(FORMAT) as SynapseDateFormat;
        }
      }
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
