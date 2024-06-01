import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

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

type EntityConfiguration = {
  state?: AlarmControlPanelStates;
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

type EntityEvents = {
  arm_custom_bypass: { code: string };
  trigger: { code: string };
  arm_vacation: { code: string };
  arm_night: { code: string };
  arm_away: { code: string };
  arm_home: { code: string };
  disarm: { code: string };
};

export function VirtualAlarmControlPanel({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: [
      "arm_custom_bypass",
      "trigger",
      "arm_vacation",
      "arm_night",
      "arm_away",
      "arm_home",
      "disarm",
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

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
