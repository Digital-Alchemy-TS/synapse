import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";
import { SensorDeviceClasses } from "./sensor";

export type SynapseTimeParams = BaseEntityParams<string> &
  TimeConfiguration & {
    set_value?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

// supposed to be the same thing
export type TimeDeviceClasses = SensorDeviceClasses;
type SetValueData = { value: string };

export type TimeConfiguration = EntityConfigCommon;

export type SynapseVirtualTime = BaseVirtualEntity<
  string,
  object,
  TimeConfiguration
> & { onSetValue: CreateRemovableCallback<SetValueData> };
