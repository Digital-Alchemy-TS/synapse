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
    /**
     * The maximum accepted value in the number's native_unit_of_measurement (inclusive)
     */
    native_max_value?: number;
    /**
     * The minimum accepted value in the number's native_unit_of_measurement (inclusive)
     */
    native_min_value?: number;
    /**
     * Defines the resolution of the values, i.e. the smallest increment or decrement in the number's
     */
    step?: number;
    /**
     * The value of the number in the number's native_unit_of_measurement.
     */
    native_value?: number;
  };

export type SynapseVirtualNumber = BaseVirtualEntity<number, object, NumberConfiguration> & {
  onSetValue: CreateRemovableCallback<SetValueData>;
};
