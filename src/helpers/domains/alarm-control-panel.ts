import { TContext } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";

import { BASE_CONFIG_KEYS, EntityConfigCommon } from "../common-config.helper";
import { UpdateCallback } from "../event";
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

export type TVirtualAlarmControlPanel<
  STATE extends AlarmControlPanelValue = AlarmControlPanelValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends
    AlarmControlPanelConfiguration = AlarmControlPanelConfiguration,
  ENTITY_ID extends // @ts-expect-error is fine
    PICK_ENTITY<"alarm_control_panel"> = PICK_ENTITY<"alarm_control_panel">,
> = {
  /**
   * Do not define attributes that change frequently.
   * Create new sensors instead
   */
  attributes: ATTRIBUTES;
  configuration: CONFIGURATION;
  _rawAttributes: ATTRIBUTES;
  _rawConfiguration: ATTRIBUTES;
  name: string;
  /**
   * Receive disarm command.
   */
  onAlarmDisarm: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm home command.
   */
  onAlarmArmHome: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm away command.
   */
  onAlarmArmAway: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm night command.
   */
  onAlarmNight: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm vacation command.
   */
  onAlarmArmVacation: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm vacation command.
   */
  onAlarmTrigger: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm custom bypass command.
   */
  onAlarmCustomBypass: (code: string, remove: () => void) => RemoveReturn;
  /**
   * look up the entity id, and
   */
  onUpdate: UpdateCallback<ENTITY_ID>;
  /**
   * the current state
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};
