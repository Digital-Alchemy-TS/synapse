import type { TServiceParams } from "@digital-alchemy/core";
import { SECOND } from "@digital-alchemy/core";
import type { ServiceListField, TUniqueId } from "@digital-alchemy/hass";
import { hostname, userInfo } from "os";

import type { AbandonedEntityResponse } from "../index.mts";

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
  const SERVICE_REGISTRY = new Map<string, ServiceListField>();

  async function _emitHeartBeat() {
    const hash = synapse.storage.hash();
    logger.trace("heartbeat");
    await hass.socket.sendMessage({
      hash,
      type: "synapse/heartbeat",
    });
  }

  async function sendRegistration(type: string) {
    await hass.socket.sendMessage({
      app_metadata: {
        app: internal.boot.application.name,
        cleanup: config.synapse.ENTITY_CLEANUP_METHOD,
        device: synapse.device.getInfo(),
        hash: synapse.storage.hash(),
        hostname: hostname(),
        secondary_devices: synapse.device.list(),
        service: [...SERVICE_REGISTRY.values()],
        title: config.synapse.METADATA_TITLE,
        username: userInfo().username,
        ...synapse.storage.dump(),
      },
      type,
      unique_id: config.synapse.METADATA_UNIQUE_ID,
    });
  }

  lifecycle.onReady(() => {
    logger.debug("setting up application heartbeat");
    scheduler.setInterval(
      async () => await _emitHeartBeat(),
      config.synapse.HEARTBEAT_INTERVAL * SECOND,
    );
    hass.socket.registerMessageHandler("synapse/request_configuration", async () => {
      logger.info("resending registration");
      void sendRegistration("synapse/update_configuration");
    });
    hass.socket.registerMessageHandler("synapse/service_call", async data => {
      logger.error({ data }, `received data`);
    });
  });

  // * onConnect
  hass.socket.onConnect(async () => {
    logger.debug("sending application registration");
    await sendRegistration("synapse/register");
  });

  lifecycle.onPreShutdown(async () => {
    logger.trace("sending going offline");
    await hass.socket.sendMessage({
      type: "synapse/going_offline",
    });
    goingOffline = true;
  });

  async function listAbandonedEntities() {
    if (config.synapse.ENTITY_CLEANUP_METHOD === "delete") {
      logger.error(
        { ENTITY_CLEANUP_METHOD: config.synapse.ENTITY_CLEANUP_METHOD },
        "cannot list abandoned entities",
      );
      return [];
    }
    const result = await hass.socket.sendMessage<AbandonedEntityResponse>({
      type: "synapse/abandoned_entities",
    });
    return result.abandoned_entities;
  }

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
    await hass.socket.sendMessage({
      data,
      type: "synapse/patch_entity",
      unique_id,
    });
  }

  return {
    SERVICE_REGISTRY,
    _emitHeartBeat,
    listAbandonedEntities,
    send,
    sendRegistration,
  };
}
