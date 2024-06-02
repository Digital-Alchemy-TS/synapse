import { is, TServiceParams } from "@digital-alchemy/core";
import { networkInterfaces } from "os";

const EXTRA_EARLY = 1000;

function getLocalIPAddress(): string | undefined {
  const interfaces = networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    if (addresses) {
      for (const addressInfo of addresses) {
        if (addressInfo.family === "IPv4" && !addressInfo.internal) {
          return addressInfo.address;
        }
      }
    }
  }
  return undefined;
}

export function Configure({ lifecycle, config, logger, internal }: TServiceParams) {
  // setting up the default that can't be declared at the module level
  lifecycle.onPreInit(() => {
    if (is.empty(config.synapse.METADATA_TITLE)) {
      const { name } = internal.boot.application;
      logger.debug({ METADATA_TITLE: name, name: "onPreInit" }, `updating [METADATA_TITLE]`);
      internal.boilerplate.configuration.set("synapse", "METADATA_TITLE", name);
    }
  });

  // Mental note:
  // This needs to happen in the `onPostConfig` step because the fastify port may change
  lifecycle.onPostConfig(() => {
    if (is.empty(config.synapse.METADATA_HOST)) {
      const METADATA_HOST = `${getLocalIPAddress()}:${config.fastify.PORT}`;
      logger.debug({ METADATA_HOST, name: "onPostConfig" }, `updating [METADATA_HOST]`);
      internal.boilerplate.configuration.set("synapse", "METADATA_HOST", METADATA_HOST);
    }
  }, EXTRA_EARLY);
}
