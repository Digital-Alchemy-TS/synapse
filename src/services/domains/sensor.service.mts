import type { TServiceParams } from "@digital-alchemy/core";
import type { ByIdProxy, PICK_ENTITY } from "@digital-alchemy/hass";

import type {
  AddEntityOptions,
  CallbackData,
  DateSensor,
  DateStateTypeMap,
  ExtraSensorInfo,
  SensorConfiguration,
  SensorDeviceClasses,
  SynapseEntityProxy,
} from "../../helpers/index.mts";
import { SynapseEntityException } from "../../helpers/index.mts";

export type SensorEvents = {};

const DATE_SENSOR_TYPES = new Set(["date", "iso", "dayjs"]);

export const DATA_TYPES = new Map<string, "number" | "string" | "date">([
  ["apparent_power", "number"],
  ["aqi", "number"],
  ["atmospheric_pressure", "number"],
  ["battery", "number"],
  ["carbon_dioxide", "number"],
  ["carbon_monoxide", "number"],
  ["current", "number"],
  ["data_rate", "number"],
  ["data_size", "number"],
  ["date", "date"],
  ["distance", "number"],
  ["duration", "number"],
  ["energy", "number"],
  ["enum", "string"],
  ["frequency", "number"],
  ["gas", "number"],
  ["humidity", "number"],
  ["illuminance", "number"],
  ["irradiance", "number"],
  ["moisture", "number"],
  ["monetary", "string"],
  ["nitrogen_monoxide", "number"],
  ["nitrous_oxide", "number"],
  ["ozone", "number"],
  ["pm1", "number"],
  ["pm10", "number"],
  ["pm25", "number"],
  ["power", "number"],
  ["power_factor", "number"],
  ["precipitation", "number"],
  ["precipitation_intensity", "number"],
  ["pressure", "number"],
  ["reactive_power", "number"],
  ["signal_strength", "number"],
  ["sound_pressure", "number"],
  ["speed", "number"],
  ["temperature", "number"],
  ["timestamp", "date"],
  ["volatile_organic_compounds", "number"],
  ["voltage", "number"],
  ["volume", "number"],
  ["water", "number"],
  ["weight", "number"],
  ["wind_speed", "number"],
]);

type AddParams<DEVICE_CLASS extends SensorDeviceClasses = SensorDeviceClasses> = {
  device_class?: DEVICE_CLASS;
  extra?: ExtraSensorInfo<DEVICE_CLASS>;
  locals?: object;
  attributes?: object;
};

type Generic = SensorConfiguration<
  SensorDeviceClasses,
  ExtraSensorInfo<SensorDeviceClasses>,
  object,
  object,
  object
>;

export function VirtualSensor({
  context,
  synapse,
  logger,
  internal: {
    utils: { is },
  },
}: TServiceParams) {
  function checkOptions(value: string, current: Generic) {
    if (
      "options" in current &&
      is.array(current.options) &&
      !is.empty(current.options) &&
      is.array(current.options)
    ) {
      const included = current.options.includes(value as string);
      if (!included) {
        logger.error(
          { options: current.options, state: value },
          `attempted to set a state not in the list of options`,
        );
        throw new SynapseEntityException(
          context,
          "BAD_SENSOR_STATE",
          `Provided a sensor state not in the declared list of options`,
        );
      }
      return true;
    }
    return false;
  }

  const generate = synapse.generator.create<Generic, SensorEvents>({
    context,
    domain: "sensor",
    load_config_keys: [
      "device_class",
      "state",
      "unit_of_measurement",
      // conditional
      "last_reset",
      "suggested_display_precision",
      "suggested_unit_of_measurement",
    ] as Extract<keyof Generic, string>[],
    // eslint-disable-next-line sonarjs/no-invariant-returns
    validate(current, key, value: unknown) {
      if (key !== "state") {
        return true;
      }
      const options = checkOptions(value as string, current);
      if (options) {
        return true;
      }
      return true;
    },
  });

  return <
    PARAMS extends AddParams,
    DATA extends object = CallbackData<
      PARAMS["locals"],
      PARAMS["attributes"],
      SensorConfiguration<
        PARAMS["device_class"],
        // @ts-expect-error typing doesn't work internally
        PARAMS["extra"],
        PARAMS["attributes"],
        PARAMS["locals"],
        object
      >
    >,
  >(
    options: AddEntityOptions<
      SensorConfiguration<
        PARAMS["device_class"],
        // @ts-expect-error typing doesn't work internally
        PARAMS["extra"],
        PARAMS["attributes"],
        PARAMS["locals"],
        DATA
      >,
      SensorEvents,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >,
  ) => {
    if ("options" in options) {
      if ("state_class" in options || "native_unit_of_measurement" in options) {
        throw new SynapseEntityException(
          context,
          "CANNOT_COMBINE_KEYS",
          "Cannot combine state_class & native_unit_of_measurement with options",
        );
      }
      // options.sensor_type ??= "string";
      options.device_class = "enum";
    }
    if ("device_class" in options && DATA_TYPES.get(options.device_class) === "date") {
      const data = options as DateSensor<keyof DateStateTypeMap>;
      data.sensor_type ??= "iso";
      if (!DATE_SENSOR_TYPES.has(data.sensor_type)) {
        throw new SynapseEntityException(
          context,
          "BAD_DATE_SENSOR_TYPE",
          `${data.sensor_type} cannot be used with date sensors`,
        );
      }
    }
    // @ts-expect-error typing doesn't work internally
    const out = generate.addEntity<PARAMS["attributes"], PARAMS["locals"], DATA>(options);

    // @ts-expect-error typing doesn't work internally
    return out as SynapseSensor<
      PARAMS["device_class"],
      // @ts-expect-error typing doesn't work internally
      PARAMS["extra"],
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >;
  };
}

export type SynapseSensor<
  DEVICE_CLASS extends SensorDeviceClasses = SensorDeviceClasses,
  EXTRA extends ExtraSensorInfo<DEVICE_CLASS> = ExtraSensorInfo<DEVICE_CLASS>,
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  SensorConfiguration<DEVICE_CLASS, EXTRA, ATTRIBUTES, LOCALS, object>,
  undefined,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"sensor">
> & {
  entity: ByIdProxy<PICK_ENTITY<"sensor">>;
};
