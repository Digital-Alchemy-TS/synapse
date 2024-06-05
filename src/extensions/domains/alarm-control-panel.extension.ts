import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type AlarmControlPanelStates =
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

export type AlarmControlPanelConfiguration = {
  state?: SettableConfiguration<AlarmControlPanelStates>;
  /**
   * Whether the code is required for arm actions.
   *
   * default: true
   */
  code_arm_required?: SettableConfiguration<boolean>;
  /**
   * One of the states listed in the code formats section.
   */
  code_format?: "number" | "text";
  /**
   * Last change triggered by.
   */
  changed_by?: SettableConfiguration<string>;
  supported_features?: number;
  /**
   * default: true
   */
  managed?: boolean;
};

export type AlarmControlPanelEvents = {
  arm_custom_bypass: { code: string };
  trigger: { code: string };
  arm_vacation: { code: string };
  arm_night: { code: string };
  arm_away: { code: string };
  arm_home: { code: string };
  alarm_disarm: { code: string };
};

export function VirtualAlarmControlPanel({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<
    AlarmControlPanelConfiguration,
    AlarmControlPanelEvents
  >({
    bus_events: [
      "arm_custom_bypass",
      "trigger",
      "arm_vacation",
      "arm_night",
      "arm_away",
      "arm_home",
      "alarm_disarm",
    ],
    context,
    // @ts-expect-error its fine
    domain: "alarm_control_panel",
    load_config_keys: [
      "state",
      "code_arm_required",
      "code_format",
      "changed_by",
      "supported_features",
    ],
  });

  return function <ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<AlarmControlPanelConfiguration, AlarmControlPanelEvents, ATTRIBUTES>) {
    const entity = generate.add_entity(options);
    if (managed) {
      entity.onArmCustomBypass(() => entity.storage.set("state", "armed_away"));
      entity.onTrigger(() => entity.storage.set("state", "triggered"));
      entity.onArmVacation(() => entity.storage.set("state", "armed_vacation"));
      entity.onArmNight(() => entity.storage.set("state", "armed_night"));
      entity.onArmAway(() => entity.storage.set("state", "armed_away"));
      entity.onArmHome(() => entity.storage.set("state", "armed_home"));
      entity.onAlarmDisarm(() => entity.storage.set("state", "disarmed"));
    }
    return entity;
  };
}
