import { TServiceParams } from "@digital-alchemy/core";
import { Server } from "node-ssdp";
import { gzipSync } from "zlib";

import { md5ToUUID } from "../helpers";

export function DiscoveryExtension({
  config,
  lifecycle,
  logger,
  context,
  hass,
  fastify,
  synapse,
}: TServiceParams) {
  let ssdp: Server;

  const payload = () => gzipSync(JSON.stringify(synapse.controller.metadata())).toString("hex");

  if (fastify) {
    fastify.routes(server => {
      const { METADATA } = config.synapse;
      const compressed = payload();
      server.get(config.synapse.SSDP_PATH, () => {
        return [
          `<?xml version="1.0"?>`,
          `<root xmlns="urn:schemas-upnp-org:device-1-0">`,
          `  <specVersion>`,
          `    <major>1</major>`,
          `    <minor>0</minor>`,
          `  </specVersion>`,
          `  <device>`,
          `    <deviceType>${config.synapse.DEVICE_TYPE}</deviceType>`,
          `    <friendlyName>${METADATA.name || config.synapse.METADATA_TITLE}</friendlyName>`,
          `    <manufacturer>synapse</manufacturer>`,
          `    <configuration>${compressed}</configuration>`,
          `    <modelName>${METADATA.model}</modelName>`,
          `    <UDN>uuid:${md5ToUUID(config.synapse.METADATA_UNIQUE_ID)}</UDN>`,
          `  </device>`,
          `</root>`,
        ].join(`\n`);
      });
    });
  }

  lifecycle.onPostConfig(() => {
    const { EVENT_NAMESPACE } = config.synapse;
    hass.socket.onEvent({
      context,
      event: `${EVENT_NAMESPACE}/reload`,
      exec() {
        logger.info({ name: "reload" }, `received config reload request`);
        hass.socket.fireEvent(`${EVENT_NAMESPACE}/configuration_reply`, {
          compressed: payload(),
        });
      },
    });
  });

  lifecycle.onReady(() => {
    if (synapse.configure.isRegistered()) {
      logger.debug({ name: "onReady" }, `skipping ssdp announcements, already configured`);
      return;
    }
    if (!fastify) {
      logger.info({ name: "onReady" }, `fastify not provided, not starting ssdp`);
      return;
    }
    logger.info({ name: "onReady" }, `starting ssdp announcements`);
    ssdp = new Server({
      location: { path: config.synapse.SSDP_PATH, port: config.fastify.PORT },
    });
    ssdp.addUSN(config.synapse.DEVICE_TYPE);
    ssdp.start();
  });

  lifecycle.onShutdownStart(() => {
    if (ssdp) {
      logger.debug({ name: "onShutdownStart" }, `stopping ssdp announcements`);
      ssdp.stop();
    }
  });
}
