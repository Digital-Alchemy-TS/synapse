import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";
import { SensorDeviceClasses } from "./sensor";

export type SynapseSelectParams = BaseEntityParams<string> &
  SelectConfiguration & {
    select_option: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

// supposed to be the same thing
export type SelectDeviceClasses = SensorDeviceClasses;
type SetValueData = { value: string };

export type SelectConfiguration = EntityConfigCommon &
  SelectDeviceClasses & {
    current_option?: string;
    options?: string[];
  };

export type SynapseVirtualSelect = BaseVirtualEntity<
  string,
  object,
  SelectConfiguration
> & { onSelectOption: CreateRemovableCallback<SetValueData> };
