// #MARK: DeviceClass
export enum DeviceClass {
  /**
   * Generic sensor. This is the default and doesn’t need to be set.
   */
  None = "None",
  /**
   * Apparent power in VA.
   */
  apparent_power = "apparent_power",
  /**
   * Air Quality Index
   */
  aqi = "aqi",
  /**
   * Atmospheric pressure in cbar, bar, hPa, inHg, kPa, mbar, Pa, psi
   */
  atmospheric_pressure = "atmospheric_pressure",
  /**
   * Percentage of battery that is left
   */
  battery = "battery",
  /**
   * Carbon Dioxide in CO2 (Smoke)
   */
  carbon_dioxide = "carbon_dioxide",
  /**
   * Carbon Monoxide in CO (Gas CNG/LPG)
   */
  carbon_monoxide = "carbon_monoxide",
  /**
   * Current in A
   */
  current = "current",
  /**
   * Data rate in bit/s, kbit/s, Mbit/s, Gbit/s, B/s, kB/s, MB/s, GB/s, KiB/s, MiB/s, or GiB/s
   */
  data_rate = "data_rate",
  /**
   * Data size in bit, kbit, Mbit, Gbit, B, kB, MB, GB, TB, PB, EB, ZB, YB, KiB, MiB, GiB, TiB, PiB, EiB, ZiB, or YiB
   */
  data_size = "data_size",
  /**
   * Date string (ISO 8601)
   */
  date = "date",
  /**
   * Generic distance in km, m, cm, mm, mi, yd, or in
   */
  distance = "distance",
  /**
   * Duration in days, hours, minutes or seconds
   */
  duration = "duration",
  /**
   * Energy in Wh, kWh or MWh
   */
  energy = "energy",
  /**
   * Has a limited set of (non-numeric) states
   */
  enum = "enum",
  /**
   * Frequency in Hz, kHz, MHz or GHz
   */
  frequency = "frequency",
  /**
   * Gas volume in m³ or ft³
   */
  gas = "gas",
  /**
   * Percentage of humidity in the air
   */
  humidity = "humidity",
  /**
   * The current light level in lx or lm
   */
  illuminance = "illuminance",
  /**
   * Percentage of water in a substance
   */
  moisture = "moisture",
  /**
   * The monetary value
   */
  monetary = "monetary",
  /**
   * Concentration of Nitrogen Dioxide in µg/m³
   */
  nitrogen_dioxide = "nitrogen_dioxide",
  /**
   * Concentration of Nitrogen Monoxide in µg/m³
   */
  nitrogen_monoxide = "nitrogen_monoxide",
  /**
   * Concentration of Nitrous Oxide in µg/m³
   */
  nitrous_oxide = "nitrous_oxide",
  /**
   * Concentration of Ozone in µg/m³
   */
  ozone = "ozone",
  /**
   * Concentration of particulate matter less than 1 micrometer in µg/m³
   */
  pm1 = "pm1",
  /**
   * Concentration of particulate matter less than 10 micrometers in µg/m³
   */
  pm10 = "pm10",
  /**
   * Concentration of particulate matter less than 2.5 micrometers in µg/m³
   */
  pm25 = "pm25",
  /**
   * Power factor in %
   */
  power_factor = "power_factor",
  /**
   * Power in W or kW
   */
  power = "power",
  /**
   * Precipitation intensity in in/d, in/h, mm/d, or mm/h
   */
  precipitation_intensity = "precipitation_intensity",
  /**
   * Pressure in Pa, kPa, hPa, bar, cbar, mbar, mmHg, inHg, or psi
   */
  pressure = "pressure",
  /**
   * Reactive power in var
   */
  reactive_power = "reactive_power",
  /**
   * Signal strength in dB or dBm
   */
  signal_strength = "signal_strength",
  /**
   * Sound pressure in dB or dBA
   */
  sound_pressure = "sound_pressure",
  /**
   * Generic speed in ft/s, in/d, in/h, km/h, kn, m/s, mph, or mm/d
   */
  speed = "speed",
  /**
   * Concentration of sulphur dioxide in µg/m³
   */
  sulphur_dioxide = "sulphur_dioxide",
  /**
   * Temperature in °C or °F
   */
  temperature = "temperature",
  /**
   * Datetime object or timestamp string (ISO 8601)
   *
   * ISO8601 format: https://en.wikipedia.org/wiki/ISO_8601
   */
  timestamp = "timestamp",
  /**
   * Concentration of volatile organic compounds in µg/m³
   */
  volatile_organic_compounds = "volatile_organic_compounds",
  /**
   * Voltage in V
   */
  voltage = "voltage",
  /**
   * Generic volume in L, mL, gal, fl. oz., m³, or ft³
   */
  volume = "volume",
  /**
   * Water consumption in L, gal, m³, or ft³
   */
  water = "water",
  /**
   * Generic mass in kg, g, mg, µg, oz, or lb
   */
  weight = "weight",
  /**
   * Wind speed in ft/s, km/h, kn, m/s, or mph
   */
  wind_speed = "wind_speed",
}

// #MARK: DurationSensor
type DurationSensor = {
  device_class: "duration";
  unit_of_measurement: "h" | "min" | "s" | "d";
};

// #MARK: TemperatureSensor
type TemperatureSensor = {
  device_class: "temperature";
  unit_of_measurement: "K" | "°C" | "°F";
};

// #MARK: Precipitation
type Precipitation = {
  device_class: "precipitation";
  unit_of_measurement: "cm" | "in" | "mm";
};

// #MARK: ApparentPowerSensor
type ApparentPowerSensor = {
  device_class: "apparent_power";
  unit_of_measurement: "VA";
};

// #MARK: WaterSensor
type WaterSensor = {
  device_class: "water";
  unit_of_measurement: "L" | "gal" | "m³" | "ft³" | "CCF";
};

// #MARK: WeightSensor
type WeightSensor = {
  device_class: "weight";
  unit_of_measurement: "kg" | "g" | "mg" | "µg" | "oz" | "lb" | "st";
};

// #MARK: WindSpeedSensor
type WindSpeedSensor = {
  device_class: "wind_speed";
  unit_of_measurement: "ft/s" | "km/h" | "kn" | "m/s" | "mph";
};

// #MARK: SpeedSensor
type SpeedSensor = {
  device_class: "speed";
  unit_of_measurement:
    | "ft/s"
    | "in/d"
    | "in/h"
    | "km/h"
    | "kn"
    | "m/s"
    | "mph"
    | "mm/d";
};

// #MARK: VoltageSensor
type VoltageSensor = {
  device_class: "voltage";
  unit_of_measurement: "V" | "mV";
};

// #MARK: SignalStrengthSensor
type SignalStrengthSensor = {
  device_class: "signal_strength";
  unit_of_measurement: "dB" | "dBm";
};

// #MARK: VolumeSensor
type VolumeSensor = {
  device_class: "volume";
  unit_of_measurement: "L" | "mL" | "gal" | "fl. oz." | "m³" | "ft³" | "CCF";
};

// #MARK: SoundPressureSensor
type SoundPressureSensor = {
  device_class: "sound_pressure";
  unit_of_measurement: "dB" | "dBA";
};

// #MARK: PressureSensor
type PressureSensor = {
  device_class: "pressure";
  unit_of_measurement:
    | "cbar"
    | "bar"
    | "hPa"
    | "inHg"
    | "kPa"
    | "mbar"
    | "Pa"
    | "psi";
};

// #MARK: ReactivePowerSensor
type ReactivePowerSensor = {
  device_class: "reactive_power";
  unit_of_measurement: "var";
};

// #MARK: PrecipitationIntensitySensor
type PrecipitationIntensitySensor = {
  device_class: "precipitation_intensity";
  unit_of_measurement: "in/d" | "in/h" | "mm/d" | "mm/h";
};

// #MARK: PowerFactorSensor
type PowerFactorSensor = {
  device_class: "power_factor";
  unit_of_measurement: "%" | "None";
};

// #MARK: PowerSensor
type PowerSensor = {
  device_class: "power";
  unit_of_measurement: "W" | "kW";
};

// #MARK: MixedGasSensor
type MixedGasSensor = {
  device_class:
    | "nitrogen_monoxide"
    | "nitrous_oxide"
    | "ozone"
    | "pm1"
    | "pm25"
    | "pm10"
    | "volatile_organic_compounds";
  unit_of_measurement: "µg/m³";
};

// #MARK: IlluminanceSensor
type IlluminanceSensor = {
  device_class: "illuminance";
  unit_of_measurement: "lx";
};

// #MARK: IrradianceSensor
type IrradianceSensor = {
  device_class: "irradiance";
  unit_of_measurement: "W/m²" | "BTU/(h⋅ft²)";
};

// #MARK: GasSensor
type GasSensor = {
  device_class: "gas";
  unit_of_measurement: "m³" | "ft³" | "CCF";
};

// #MARK: FrequencySensor
type FrequencySensor = {
  device_class: "frequency";
  unit_of_measurement: "Hz" | "kHz" | "MHz" | "GHz";
};

// #MARK: EnergySensor
type EnergySensor = {
  device_class: "energy";
  unit_of_measurement: "Wh" | "kWh" | "MWh" | "MJ" | "GJ";
};

// #MARK: DistanceSensor
type DistanceSensor = {
  device_class: "distance";
  unit_of_measurement: "km" | "m" | "cm" | "mm" | "mi" | "yd" | "in";
};

// #MARK: MonetarySensor
type MonetarySensor = {
  device_class: "monetary";
  /**
   * https://en.wikipedia.org/wiki/ISO_4217#Active_codes
   */
  unit_of_measurement: string;
};

// #MARK: DataRateSensor
type DataRateSensor = {
  device_class: "data_rate";
  unit_of_measurement:
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
};

// #MARK: DataSizeSensor
type DataSizeSensor = {
  device_class: "data_size";
  unit_of_measurement:
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
};

// #MARK: AtmosphericPressureSensor
type AtmosphericPressureSensor = {
  device_class: "atmospheric_pressure";
  unit_of_measurement:
    | "cbar"
    | "bar"
    | "hPa"
    | "inHg"
    | "kPa"
    | "mbar"
    | "Pa"
    | "psi";
};

// #MARK: CurrentSensor
type CurrentSensor = {
  device_class: "current";
  unit_of_measurement: "A" | "mA";
};

// #MARK: CarbonSensor
type CarbonSensor = {
  device_class: "carbon_dioxide" | "carbon_monoxide";
  unit_of_measurement: "ppm";
};
// #MARK: PercentSensor
type PercentSensor = {
  device_class: "battery" | "humidity" | "moisture";
  unit_of_measurement: "%";
};
// #MARK: DefaultSensor
type DefaultSensor = {
  /**
   * The type/class of the sensor to set the icon in the frontend.
   *
   * @see https://www.hass.io/integrations/sensor/#device-class
   */
  device_class?: "timestamp" | "date" | "aqi" | "enum";
  unit_of_measurement?: void;
};

// #MARK: SensorStateClass
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

// #MARK: SensorDeviceClasses
export type SensorDeviceClasses =
  | DurationSensor
  | TemperatureSensor
  | Precipitation
  | ApparentPowerSensor
  | WaterSensor
  | WeightSensor
  | WindSpeedSensor
  | SpeedSensor
  | VoltageSensor
  | SignalStrengthSensor
  | VolumeSensor
  | SoundPressureSensor
  | PressureSensor
  | ReactivePowerSensor
  | PowerFactorSensor
  | PowerSensor
  | PrecipitationIntensitySensor
  | MixedGasSensor
  | IlluminanceSensor
  | IrradianceSensor
  | PercentSensor
  | GasSensor
  | FrequencySensor
  | EnergySensor
  | DistanceSensor
  | MonetarySensor
  | DataRateSensor
  | CurrentSensor
  | CarbonSensor
  | DataSizeSensor
  | AtmosphericPressureSensor
  | DefaultSensor;

export type TEntityCategory = {
  /**
   * An entity with a category will:
   * - Not be exposed to cloud, Alexa, or Google Assistant components
   * - Not be included in indirect service calls to devices or areas
   *
   * **Config**: An entity which allows changing the configuration of a device.
   *
   * **Diagnostic**: An entity exposing some configuration parameter, or diagnostics of a device.
   */
  entity_category?: "config" | "diagnostic";
};
