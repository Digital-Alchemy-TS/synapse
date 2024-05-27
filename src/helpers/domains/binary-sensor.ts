import { BinarySensorDeviceClass } from "@digital-alchemy/hass";

import { BaseEntityParams, BaseVirtualEntity } from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseBinarySensorParams = BaseEntityParams<BinarySensorValue> &
  BinarySensorConfiguration;

export type SynapseVirtualBinarySensor = BaseVirtualEntity<
  BinarySensorValue,
  object,
  BinarySensorConfiguration
> & {
  /**
   * If the binary sensor is currently on or off.
   */
  is_on?: boolean;
};

export type BinarySensorConfiguration = EntityConfigCommon & {
  /**
   * Type of binary sensor.
   */
  device_class?: `${BinarySensorDeviceClass}`;
  /**
   * If the binary sensor is currently on or off.
   */
  is_on?: boolean;
};

export type BinarySensorValue = "on" | "off";
