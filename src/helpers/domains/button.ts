import { ButtonDeviceClass } from "@digital-alchemy/hass";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseButtonParams = BaseEntityParams<never> & ButtonConfiguration;

export type ButtonConfiguration = EntityConfigCommon & {
  press?: RemovableCallback;
  device_class?: `${ButtonDeviceClass}`;
};

export type SynapseVirtualButton = BaseVirtualEntity<
  never,
  object,
  ButtonConfiguration
> & { onPress: CreateRemovableCallback };
