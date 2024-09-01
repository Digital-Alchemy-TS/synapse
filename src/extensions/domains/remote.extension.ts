import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type RemoteConfiguration = {
  /**
   * Return the current active activity
   */
  current_activity?: SettableConfiguration<string>;
  /**
   * Return the list of available activities
   */
  activity_list?: string[];
  supported_features?: number;
};

export type RemoteEvents = {
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
  const generate = synapse.generator.create<RemoteConfiguration, RemoteEvents>({
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

  return <LOCALS extends object, ATTRIBUTES extends object>(
    options: AddEntityOptions<RemoteConfiguration, RemoteEvents, ATTRIBUTES, LOCALS>,
  ) => generate.addEntity(options);
}
