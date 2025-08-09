import { Dayjs } from "dayjs";
import { Get } from "type-fest";

import { EntityConfigCommon, SettableConfiguration } from "./common-config.mts";

// A helper type to check if a type is a union.
// It works by checking if the type is "distributive" over itself.
type IsUnion<T, U = T> = T extends U ? ([U] extends [T] ? false : true) : false;

// The main utility type that finds keys with multiple values in a union.
type KeysWithMultipleValues<T> = {
  [K in keyof T]: IsUnion<T[K]> extends true ? K : never;
}[keyof T];

// #MARK: Number
type NumberDeviceMapping = {
  temperature: "K" | "°C" | "°F";
  apparent_power: "VA";
  atmospheric_pressure: "cbar" | "bar" | "hPa" | "inHg" | "kPa" | "mbar" | "Pa" | "psi";
  current: "A" | "mA";
  distance: "km" | "m" | "cm" | "mm" | "mi" | "yd" | "in";
  duration: "h" | "min" | "s" | "d";
  energy: "Wh" | "kWh" | "MWh" | "MJ" | "GJ";
  frequency: "Hz" | "kHz" | "MHz" | "GHz";
  gas: "m³" | "ft³" | "CCF";
  illuminance: "lx";
  irradiance: "W/m²" | "BTU/(h⋅ft²)";
  power_factor: "%" | "None";
  power: "W" | "kW";
  precipitation_intensity: "in/d" | "in/h" | "mm/d" | "mm/h";
  precipitation: "cm" | "in" | "mm";
  pressure: "cbar" | "bar" | "hPa" | "inHg" | "kPa" | "mbar" | "Pa" | "psi";
  reactive_power: "var";
  signal_strength: "dB" | "dBm";
  sound_pressure: "dB" | "dBA";
  speed: "ft/s" | "in/d" | "in/h" | "km/h" | "kn" | "m/s" | "mph" | "mm/d";
  voltage: "V" | "mV";
  volume: "L" | "mL" | "gal" | "fl. oz." | "m³" | "ft³" | "CCF";
  water: "L" | "gal" | "m³" | "ft³" | "CCF";
  weight: "kg" | "g" | "mg" | "µg" | "oz" | "lb" | "st";
  wind_speed: "ft/s" | "km/h" | "kn" | "m/s" | "mph";
  nitrogen_monoxide: "µg/m³";
  nitrous_oxide: "µg/m³";
  aqi: void;
  ozone: "µg/m³";
  pm1: "µg/m³";
  pm25: "µg/m³";
  pm10: "µg/m³";
  volatile_organic_compounds: "µg/m³";
  /**
   * https://en.wikipedia.org/wiki/ISO_4217#Active_codes
   */
  monetary: string;
  data_rate:
    | "bit/s"
    | "kbit/s"
    | "Mbit/s"
    | "Gbit/s"
    | "B/s"
    | "kB/s"
    | "MB/s"
    | "GB/s"
    | "KiB/s"
    | "MiB/s"
    | "GiB/s";
  data_size:
    | "bit"
    | "kbit"
    | "Mbit"
    | "Gbit"
    | "B"
    | "kB"
    | "MB"
    | "GB"
    | "TB"
    | "PB"
    | "EB"
    | "ZB"
    | "YB"
    | "KiB"
    | "MiB"
    | "GiB"
    | "TiB"
    | "PiB"
    | "EiB"
    | "ZiB"
    | "YiB";
  carbon_dioxide: "ppm";
  carbon_monoxide: "ppm";
  battery: "%";
  humidity: "%";
  moisture: "%";
};

export enum SensorStateClass {
  /**
   * The state represents a measurement in present time, not a historical aggregation such as statistics or a prediction of the future.
   *
   * Examples of what should be classified `measurement` are: current temperature, humidity or electric power.
   *
   * Examples of what should not be classified as `measurement`: Forecasted temperature for tomorrow, yesterday's energy consumption or anything else that doesn't include the current measurement.
   *
   * For supported sensors, statistics of hourly min, max and average sensor readings is updated every 5 minutes.
   */
  MEASUREMENT = "measurement",
  /**
   * The state represents a total amount that can both increase and decrease, e.g. a net energy meter.
   * Statistics of the accumulated growth or decline of the sensor's value since it was first added is updated every 5 minutes.
   * This state class should not be used for sensors where the absolute value is interesting instead of the accumulated growth or decline, for example remaining battery capacity or CPU load; in such cases state class measurement should be used instead.
   */
  TOTAL = "total",
  /**
   * Similar to total, with the restriction that the state represents a monotonically increasing positive total which periodically restarts counting from 0, e.g. a daily amount of consumed gas, weekly water consumption or lifetime energy consumption.
   * Statistics of the accumulated growth of the sensor's value since it was first added is updated every 5 minutes.
   * A decreasing value is interpreted as the start of a new meter cycle or the replacement of the meter.
   */
  TOTAL_INCREASING = "total_increasing",
}

export type NumberSensors<DEVICE_CLASS extends keyof NumberDeviceMapping> = {
  device_class: DEVICE_CLASS;
  unit_of_measurement: NumberDeviceMapping[DEVICE_CLASS];
  state?: SettableConfiguration<number, object>;
  /**
   * The number of decimals which should be used in the sensor's state when it's displayed.
   */
  suggested_display_precision?: number;

  /**
   * The time when an accumulating sensor such as an electricity usage meter, gas meter, water meter etc. was initialized.
   *
   * If the time of initialization is unknown, set it to `None`.
   *
   * Note that the `datetime.datetime` returned by the `last_reset` property will be converted to an ISO 8601-formatted string when the entity's state attributes are updated. When changing `last_reset`, the `state` must be a valid number.
   */
  last_reset?: SettableConfiguration<Dayjs, object>;

  /**
   * Type of state.
   * If not `None`, the sensor is assumed to be numerical and will be displayed as a line-chart in the frontend instead of as discrete values.
   */
  state_class?: SensorStateClass | `${SensorStateClass}`;
} & (NumberDeviceMapping[DEVICE_CLASS] extends void
  ? {}
  : { unit_of_measurement: NumberDeviceMapping[DEVICE_CLASS] }) &
  (DEVICE_CLASS extends KeysWithMultipleValues<NumberDeviceMapping>
    ? {
        /**
         * The unit of measurement to be used for the sensor's state.
         * For sensors with a unique_id, this will be used as the initial unit of measurement, which users can then override.
         * For sensors without a unique_id, this will be the unit of measurement for the sensor's state.
         * This property is intended to be used by integrations to override automatic unit conversion rules, for example,
         * to make a temperature sensor always display in °C regardless of whether the configured unit system prefers °C or °F,
         * or to make a distance sensor always display in miles even if the configured unit system is metric.
         */
        suggested_unit_of_measurement?: NumberDeviceMapping[DEVICE_CLASS];
      }
    : {});

// #MARK: Date
export type DateStateTypeMap = {
  dayjs: Dayjs;
  date: Date;
  iso: string;
};

type DateState<TYPE extends keyof DateStateTypeMap> = {
  sensor_type?: TYPE;
  state?: SettableConfiguration<DateStateTypeMap[TYPE], object>;
};

export type DateSensor<TYPE extends keyof DateStateTypeMap> = {
  device_class: "timestamp" | "date";
  unit_of_measurement?: void;
} & DateState<TYPE>;

// #MARK: Options
type OptionsSensor<OPTIONS extends string> = {
  device_class: "enum";
  /**
   * In case this sensor provides a textual state, this property can be used to provide a list of possible states.
   * Requires the enum device class to be set.
   * Cannot be combined with `state_class` or `native_unit_of_measurement`.
   */
  options: Array<OPTIONS>;
  state?: SettableConfiguration<OPTIONS, object>;
  unit_of_measurement?: void;
};

type DefaultSensor = {
  device_class?: void;
  unit_of_measurement?: void;
  state?: SettableConfiguration<string, object>;
};

export type NumberDeviceClasses = Get<NumberSensors<keyof NumberDeviceMapping>, "device_class">;
type DateDeviceClasses = Get<DateSensor<"iso">, "device_class">;
type OptionsDeviceClasses = Get<OptionsSensor<string>, "device_class">;
export type SensorDeviceClasses = NumberDeviceClasses | DateDeviceClasses | OptionsDeviceClasses;

export type ExtraSensorInfo<DEVICE_CLASS extends SensorDeviceClasses> =
  DEVICE_CLASS extends NumberDeviceClasses
    ? void
    : DEVICE_CLASS extends DateDeviceClasses
      ? keyof DateStateTypeMap
      : DEVICE_CLASS extends OptionsDeviceClasses
        ? string
        : // default type
          void;

export type SensorConfiguration<
  DEVICE_CLASS extends SensorDeviceClasses,
  EXTRA extends ExtraSensorInfo<DEVICE_CLASS>,
  ATTRIBUTES extends object,
  LOCALS extends object,
  DATA extends object,
> = Partial<
  EntityConfigCommon<ATTRIBUTES, LOCALS, DATA> &
    (DEVICE_CLASS extends NumberDeviceClasses
      ? NumberSensors<DEVICE_CLASS>
      : DEVICE_CLASS extends DateDeviceClasses
        ? // @ts-expect-error something about the formula isn't quite correct
          DateSensor<EXTRA>
        : DEVICE_CLASS extends OptionsDeviceClasses
          ? // @ts-expect-error something about the formula isn't quite correct
            OptionsSensor<EXTRA>
          : DefaultSensor)
>;
