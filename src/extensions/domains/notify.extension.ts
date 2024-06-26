import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

export type NotifyConfiguration = {
  //
};

export type NotifyEvents = {
  send_message: {
    message: string;
    title?: string;
  };
};

export function VirtualNotify({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<NotifyConfiguration, NotifyEvents>({
    bus_events: ["send_message"],
    context,
    // @ts-expect-error its fine
    domain: "notify",
    load_config_keys: [],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<NotifyConfiguration, NotifyEvents, ATTRIBUTES>,
  ) => generate.addEntity(options);
}
