import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";
import { SensorDeviceClasses } from "./sensor";

export type SynapseAlarmControlPanelParams =
  BaseEntityParams<AlarmControlPanelStates> &
    AlarmControlPanelConfiguration & {
      arm_custom_bypass: RemovableCallback<SetValueData>;
      trigger: RemovableCallback<SetValueData>;
      arm_vacation: RemovableCallback<SetValueData>;
      arm_night: RemovableCallback<SetValueData>;
      arm_away: RemovableCallback<SetValueData>;
      arm_home: RemovableCallback<SetValueData>;
      disarm: RemovableCallback<SetValueData>;
    };

// supposed to be the same thing
type AlarmControlPanelStates =
  | "disarmed"
  | "armed_home"
  | "armed_away"
  | "armed_night"
  | "armed_vacation"
  | "armed_custom_bypass"
  | "pending"
  | "arming"
  | "disarming"
  | "triggered";
export type AlarmControlPanelDeviceClasses = SensorDeviceClasses;
type SetValueData = { code: string };

export type AlarmControlPanelConfiguration = EntityConfigCommon &
  AlarmControlPanelDeviceClasses & {
    /**
     * default: true
     */
    code_arm_required?: boolean;
    code_format?: "number" | "text";
    changed_by?: string;
    supported_features?: number;
  };

export type SynapseVirtualAlarmControlPanel = BaseVirtualEntity<
  AlarmControlPanelStates,
  object,
  AlarmControlPanelConfiguration
> & {
  onArmCustomBypass: CreateRemovableCallback<SetValueData>;
  onTrigger: CreateRemovableCallback<SetValueData>;
  onArmVacation: CreateRemovableCallback<SetValueData>;
  onArmNight: CreateRemovableCallback<SetValueData>;
  onArmAway: CreateRemovableCallback<SetValueData>;
  onArmHome: CreateRemovableCallback<SetValueData>;
  onDisarm: CreateRemovableCallback<SetValueData>;
};
