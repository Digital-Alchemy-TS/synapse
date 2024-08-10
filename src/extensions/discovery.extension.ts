import { TServiceParams } from "@digital-alchemy/core";
import { Server } from "node-ssdp";
import { hostname, userInfo } from "os";
import { gzipSync } from "zlib";

import { md5ToUUID } from "../helpers";

export function DiscoveryExtension({
  config,
  lifecycle,
  logger,
  context,
  internal,
  hass,
  fastify,
  synapse,
}: TServiceParams) {
  let ssdp: Server;

  // * Raw data payload
  const APP_METADATA = () => ({
    app: internal.boot.application.name,
    device: synapse.device.getInfo(),
    host: config.synapse.METADATA_HOST,
    hostname: hostname(),
    secondary_devices: synapse.device.list(),
    title: config.synapse.METADATA_TITLE,
    unique_id: config.synapse.METADATA_UNIQUE_ID,
    username: userInfo().username,
    ...synapse.storage.dump(),
  });

  // * Build the compressed version
  const payload = () => gzipSync(JSON.stringify(APP_METADATA())).toString("hex");

  // * If fastify is provided, set up a response with SSDP xml
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

  // * Set up event listeners for hass reloads
  lifecycle.onPostConfig(() => {
    const { EVENT_NAMESPACE } = config.synapse;
    const { name } = internal.boot.application;
    // * Discover all
    hass.socket.onEvent({
      context,
      event: `${EVENT_NAMESPACE}/discovery`,
      exec() {
        if (synapse.configure.isRegistered()) {
          logger.debug({ name: "discovery" }, `received global discovery request, ignoring`);
          return;
        }
        logger.info({ name: "discovery" }, `global discovery`);
        hass.socket.fireEvent(`${EVENT_NAMESPACE}/identify`, { compressed: payload() });
      },
    });

    // * Specific identify
    hass.socket.onEvent({
      context,
      event: `${EVENT_NAMESPACE}/discovery/${name}`,
      exec() {
        logger.info({ name: "discovery" }, `app discovery`);
        hass.socket.fireEvent(`${EVENT_NAMESPACE}/identify/${name}`, {
          compressed: payload(),
        });
      },
    });
  });

  // * SSDP announcements
  lifecycle.onReady(function onReady() {
    if (synapse.configure.isRegistered()) {
      logger.trace({ name: onReady }, `skipping ssdp announcements, already configured`);
      return;
    }
    if (!fastify) {
      logger.trace({ name: onReady }, `fastify not provided, not starting ssdp`);
      return;
    }
    logger.info({ name: onReady }, `starting ssdp announcements`);
    ssdp = new Server({ location: { path: config.synapse.SSDP_PATH, port: config.fastify.PORT } });
    ssdp.addUSN(config.synapse.DEVICE_TYPE);
    ssdp.start();
  });

  // * Shutdown
  lifecycle.onShutdownStart(function onShutdownStart() {
    if (ssdp) {
      logger.debug({ name: onShutdownStart }, `stopping ssdp announcements`);
      ssdp.stop();
    }
  });
}
