import { TContext } from "@digital-alchemy/core";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { TSynapseId } from "../utility.helper";

export type TAlarmControlPanel<
  STATE extends AlarmControlPanelValue,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
  defaultState?: STATE;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & AlarmControlPanelConfiguration;

export type AlarmControlPanelConfiguration = EntityConfigCommon & {
  code_arm_required?: boolean;
  code_format?: "text" | "number";
  supported_features?: number;
  changed_by?: string;
};

export type AlarmControlPanelValue =
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

export const ALARM_CONTROL_PANEL_CONFIGURATION_KEYS = [
  ...BASE_CONFIG_KEYS,
  "device_class",
] as (keyof AlarmControlPanelConfiguration)[];

export type HassAlarmControlPanelEvent = {
  data: { unique_id: TSynapseId; code: string };
};

export type RemoveReturn = { remove: () => void };