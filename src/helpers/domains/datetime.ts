import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";
import { SensorDeviceClasses } from "./sensor";

export type SynapseDateTimeParams = BaseEntityParams<string> &
  DateTimeConfiguration & {
    set_value: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

// supposed to be the same thing
export type DateTimeDeviceClasses = SensorDeviceClasses;
type SetValueData = { value: string };

export type DateTimeConfiguration = EntityConfigCommon;

export type SynapseVirtualDateTime = BaseVirtualEntity<
  string,
  object,
  DateTimeConfiguration
> & { onSetValue: CreateRemovableCallback<SetValueData> };
