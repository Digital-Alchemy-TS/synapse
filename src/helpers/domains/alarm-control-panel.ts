import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseAlarmControlPanelParams = BaseEntityParams<AlarmControlPanelStates> &
  AlarmControlPanelConfiguration & {
    arm_custom_bypass?: RemovableCallback<SetValueData>;
    trigger?: RemovableCallback<SetValueData>;
    arm_vacation?: RemovableCallback<SetValueData>;
    arm_night?: RemovableCallback<SetValueData>;
    arm_away?: RemovableCallback<SetValueData>;
    arm_home?: RemovableCallback<SetValueData>;
    disarm?: RemovableCallback<SetValueData>;
  };

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
type SetValueData = { code: string };

export type AlarmControlPanelConfiguration = EntityConfigCommon & {
  /**
   * Whether the code is required for arm actions.
   *
   * default: true
   */
  code_arm_required?: boolean;
  /**
   * One of the states listed in the code formats section.
   */
  code_format?: "number" | "text";
  /**
   * Last change triggered by.
   */
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
