import { SECOND, TServiceParams } from "@digital-alchemy/core";

export function SocketExtension({
  logger,
  lifecycle,
  hass,
  scheduler,
  config,
  internal,
}: TServiceParams) {
  const getIdentifier = () => internal.boot.application.name;
  const name = (a: string) => [config.synapse.EVENT_NAMESPACE, a, getIdentifier()].join("/");

  // * onPostConfig
  lifecycle.onPostConfig(async () => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.trace({ name: "onPostConfig" }, `starting heartbeat`);
    scheduler.interval({
      exec: async () => await hass.socket.fireEvent(name("heartbeat")),
      interval: config.synapse.HEARTBEAT_INTERVAL * SECOND,
    });
  });

  // * onConnect
  hass.socket.onConnect(async () => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.debug({ name: "onConnect" }, `reconnect heartbeat`);
    await hass.socket.fireEvent(name("heartbeat"));
  });

  // * onPreShutdown
  lifecycle.onPreShutdown(async () => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.debug({ name: "onPreShutdown" }, `notifying synapse extension of shutdown`);
    await hass.socket.fireEvent(name("shutdown"));
  });

  async function send(unique_id: string, data: object): Promise<void> {
    if (hass.socket.connectionState !== "connected") {
      logger.debug({ name: "send" }, `socket connection isn't active, not sending update event`);
      return;
    }
    logger.trace({ data, unique_id }, `update`);
    await hass.socket.fireEvent(name("update"), { data, unique_id });
  }

  return { send };
}
