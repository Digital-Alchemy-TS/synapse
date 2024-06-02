import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
  /**
   * Return the current active activity
   */
  current_activity?: string;
  /**
   * Return the list of available activities
   */
  activity_list?: string[];
  supported_features?: number;
};

type EntityEvents = {
  turn_on: { activity?: string };
  turn_off: { activity?: string };
  toggle: { activity?: string };
  send_command: { command: string[] };
  learn_command: {
    //
  };
  delete_command: {
    //
  };
};

export function VirtualRemote({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
    bus_events: [
      "turn_on",
      "turn_off",
      "toggle",
      "send_command",
      "learn_command",
      "delete_command",
    ],
    context,
    // @ts-expect-error its fine
    domain: "remote",
    load_config_keys: ["current_activity", "activity_list", "supported_features"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
