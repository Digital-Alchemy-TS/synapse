import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, BasicAddParams } from "../..";

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

  return <PARAMS extends BasicAddParams>(
    options: AddEntityOptions<
      NotifyConfiguration,
      NotifyEvents,
      PARAMS["attributes"],
      PARAMS["locals"]
    >,
  ) => generate.addEntity(options);
}
