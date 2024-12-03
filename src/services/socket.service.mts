import { SECOND, TServiceParams } from "@digital-alchemy/core";
import { TUniqueId } from "@digital-alchemy/hass";

export function SynapseSocketService({
  logger,
  lifecycle,
  hass,
  scheduler,
  config,
  synapse,
  internal,
}: TServiceParams) {
  const getIdentifier = () => internal.boot.application.name;
  const name = (a: string) => [config.synapse.EVENT_NAMESPACE, a, getIdentifier()].join("/");

  const emitted = new Set<number>();

  async function emitHeartBeat() {
    logger.trace("heartbeat");
    const now = Date.now();
    emitted.add(now);
    await hass.socket.fireEvent(name("heartbeat"), { now });
    scheduler.setTimeout(() => emitted.delete(now), SECOND);
  }

  function setupHeartbeat() {
    logger.trace({ name: setupHeartbeat }, `starting heartbeat`);
    return scheduler.setInterval(
      async () => await emitHeartBeat(),
      config.synapse.HEARTBEAT_INTERVAL * SECOND,
    );
  }
  // * onPostConfig
  lifecycle.onPostConfig(() => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    synapse.socket.setupHeartbeat();
  });

  // * onConnect
  hass.socket.onConnect(async function onConnect() {
    if (!config.synapse.EMIT_HEARTBEAT) {
      logger.warn("heartbeat disabled");
      return;
    }
    logger.debug({ name: onConnect }, `reconnect heartbeat`);
    await hass.socket.fireEvent(name("heartbeat"));
  });

  // * onPreShutdown
  lifecycle.onPreShutdown(async () => {
    if (!config.synapse.EMIT_HEARTBEAT) {
      return;
    }
    logger.debug({ name: "onPreShutdown" }, `sending shutdown notification`);
    await hass.socket.fireEvent(name("shutdown"));
  });

  async function send(unique_id: string, data: object): Promise<void> {
    if (hass.socket.connectionState !== "connected") {
      logger.debug({ name: send }, `socket connection isn't active, not sending update event`);
      return;
    }
    if (!synapse.configure.isRegistered()) {
      logger.trace({ data, name: send, unique_id }, `skipping update: not registered`);
      return;
    }
    const entity_id = hass.idBy.unique_id(unique_id as TUniqueId);
    if (entity_id) {
      logger.trace({ entity_id, name: send }, `update`);
    } else {
      logger.warn({ data, name: send, unique_id }, `updating unregistered entity`);
    }
    await hass.socket.fireEvent(name("update"), { data, unique_id });
  }

  return { send, setupHeartbeat };
}
