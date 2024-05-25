import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";
import { SensorDeviceClasses } from "./sensor";

export type SynapseTextParams = BaseEntityParams<string> &
  TextConfiguration & {
    set_value?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

// supposed to be the same thing
export type TextDeviceClasses = SensorDeviceClasses;
type SetValueData = { value: string };

export type TextConfiguration = EntityConfigCommon & {
  mode?: "text" | "password";
  max?: number;
  min?: number;
  pattern?: string;
};

export type SynapseVirtualText = BaseVirtualEntity<
  string,
  object,
  TextConfiguration
> & { onSetValue: CreateRemovableCallback<SetValueData> };
