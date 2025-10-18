import type { TServiceParams } from "@digital-alchemy/core";
import { SECOND } from "@digital-alchemy/core";
import type { TUniqueId } from "@digital-alchemy/hass";
import { hostname, userInfo } from "os";

export function SynapseWebSocketService({
  logger,
  lifecycle,
  hass,
  scheduler,
  config,
  synapse,
  internal,
}: TServiceParams) {
  let goingOffline = false;
  const getIdentifier = () => internal.boot.application.name;
  const name = (a: string) => [config.synapse.EVENT_NAMESPACE, a, getIdentifier()].join("/");

  async function _emitHeartBeat() {
    const hash = synapse.storage.hash();
    logger.trace("heartbeat");
    await hass.socket.sendMessage({
      hash,
      type: "synapse/heartbeat",
    });
  }

  async function _registerApp() {
    await hass.socket.sendMessage({
      app_metadata: {
        app: internal.boot.application.name,
        cleanup: config.synapse.ENTITY_CLEANUP_METHOD,
        device: synapse.device.getInfo(),
        hash: synapse.storage.hash(),
        hostname: hostname(),
        secondary_devices: synapse.device.list(),
        title: config.synapse.METADATA_TITLE,
        username: userInfo().username,
        ...synapse.storage.dump(),
      },
      type: "synapse/register",
      unique_id: config.synapse.METADATA_UNIQUE_ID,
    });
  }

  lifecycle.onReady(() => {
    logger.debug("setting up application heartbeat");
    scheduler.setInterval(
      async () => await _emitHeartBeat(),
      config.synapse.HEARTBEAT_INTERVAL * SECOND,
    );
  });

  // * onConnect
  hass.socket.onConnect(async () => {
    logger.debug("sending application registration");
    await _registerApp();
  });

  lifecycle.onPreShutdown(async () => {
    logger.trace("sending going offline");
    await hass.socket.sendMessage({
      type: "synapse/going_offline",
    });
    goingOffline = true;
  });

  async function send(unique_id: string, data: object): Promise<void> {
    if (goingOffline) {
      logger.error("blocked synapse socket message (offline)");
      return;
    }
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

  return {
    _emitHeartBeat,
    _registerApp,
    send,
  };
}
