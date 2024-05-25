import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";
import { SensorDeviceClasses } from "./sensor";

export type SynapseNumberParams = BaseEntityParams<number> &
  NumberConfiguration & {
    set_value?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

// supposed to be the same thing
export type NumberDeviceClasses = SensorDeviceClasses;
type SetValueData = { value: number };

export type NumberConfiguration = EntityConfigCommon &
  NumberDeviceClasses & {
    /**
     * Defines how the number should be displayed in the UI.
     * It's recommended to use the default `auto`.
     * Can be `box` or `slider` to force a display mode.
     */
    mode?: "auto" | "slider" | "box";
    max_value?: number;
    min_value?: number;
    step?: number;
  };

export type SynapseVirtualNumber = BaseVirtualEntity<
  number,
  object,
  NumberConfiguration
> & { onSetValue: CreateRemovableCallback<SetValueData> };
