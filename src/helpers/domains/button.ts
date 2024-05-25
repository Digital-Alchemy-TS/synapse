import { TBlackHole } from "@digital-alchemy/core";
import { ButtonDeviceClass } from "@digital-alchemy/hass";

import { BaseEntityParams, BaseVirtualEntity } from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";
import { TSynapseId } from "../utility.helper";

export type SynapseButtonParams = BaseEntityParams<never> & ButtonConfiguration;

export type ButtonConfiguration = EntityConfigCommon & {
  press?: (remove: () => void) => TBlackHole;
  device_class?: `${ButtonDeviceClass}`;
};

export type SynapseVirtualButton = BaseVirtualEntity<
  never,
  object,
  ButtonConfiguration
> & {
  onPress: (callback: (remove: () => void) => TBlackHole) => void;
};

export type HassButtonUpdateEvent = { data: { unique_id: TSynapseId } };
