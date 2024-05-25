import { BinarySensorDeviceClass } from "@digital-alchemy/hass";

import { BaseEntityParams, BaseVirtualEntity } from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseBinarySensorParams = BaseEntityParams<BinarySensorValue> &
  BinarySensorConfiguration;

export type SynapseVirtualBinarySensor = BaseVirtualEntity<
  BinarySensorValue,
  object,
  BinarySensorConfiguration
> & { is_on: boolean };

export type BinarySensorConfiguration = EntityConfigCommon & {
  device_class?: `${BinarySensorDeviceClass}`;
};

export type BinarySensorValue = "on" | "off";
