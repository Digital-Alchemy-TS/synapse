import type { TServiceParams } from "@digital-alchemy/core";
import { SECOND } from "@digital-alchemy/core";
import type { TUniqueId } from "@digital-alchemy/hass";
import { hostname, userInfo } from "os";
import { inspect } from "util";

import type { SynapseServiceCreateOptions } from "../index.mts";
import { type AbandonedEntityResponse } from "../index.mts";

export function SynapseWebSocketService({
  logger,
  lifecycle,
  hass,
  scheduler,
  context,
  config,
  synapse,
  internal,
}: TServiceParams) {
  let goingOffline = false;
  const SERVICE_REGISTRY = new Map<string, SynapseServiceCreateOptions>();

  async function _emitHeartBeat() {
    if (!synapse.configure.isRegistered()) {
      return;
    }
    const hash = synapse.storage.hash();
    logger.trace("heartbeat");
    await hass.socket.sendMessage({
      hash,
      type: "synapse/heartbeat",
    });
  }

  async function sendRegistration(type: string) {
    inspect.defaultOptions.depth = 20;
    // console.log([...SERVICE_REGISTRY.values()]);
    // console.log({
    //   app_metadata: {
    //     app: internal.boot.application.name,
    //     cleanup: config.synapse.ENTITY_CLEANUP_METHOD,
    //     device: synapse.device.getInfo(),
    //     hash: synapse.storage.hash(),
    //     hostname: hostname(),
    //     secondary_devices: synapse.device.list(),
    //     service: [...SERVICE_REGISTRY.values()],
    //     title: config.synapse.METADATA_TITLE,
    //     username: userInfo().username,
    //     ...synapse.storage.dump(),
    //   },
    //   type,
    //   unique_id: config.synapse.METADATA_UNIQUE_ID,
    // });
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

    /**
     * Occurs
     */
    hass.socket.registerMessageHandler("synapse/request_configuration", async () => {
      logger.info("resending registration");
      void sendRegistration("synapse/rebuild_config");
    });

    hass.socket.onEvent({
      context,
      event: "synapse/registration_ready",
      async exec({ data }: { data: { unique_id: string } }) {
        if (data.unique_id !== config.synapse.METADATA_UNIQUE_ID) {
          return;
        }
        logger.info("application accepted in user config flow");
        await sendRegistration("synapse/application_online_ready");
      },
    });
  });

  // * onConnect
  hass.socket.onConnect(async () => {
    if (!synapse.configure.isRegistered()) {
      return;
    }
    logger.debug("sending application registration");
    await sendRegistration("synapse/application_online_ready");
  });

  hass.socket.onEvent({
    context,
    event: "synapse/discovery",
    exec() {
      // Only respond if not already registered
      if (synapse.configure.isRegistered()) {
        logger.trace("skipping discovery response: already registered");
        return;
      }

      logger.debug("responding to discovery request");
      void hass.socket.fireEvent("synapse/identify", {
        app: internal.boot.application.name,
        title: config.synapse.METADATA_TITLE,
        unique_id: config.synapse.METADATA_UNIQUE_ID,
      });
    },
  });

  lifecycle.onPreShutdown(async () => {
    if (!synapse.configure.isRegistered()) {
      return;
    }
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
      logger.debug("skipping socket send, app not configured in hass");
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
