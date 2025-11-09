import type { TServiceParams } from "@digital-alchemy/core";
import { createHash } from "crypto";
import { hostname, userInfo } from "os";

type SynapseHealthSensorAttributes = {
  application_unique_id: string;
};

export function ConfigurationService({
  lifecycle,
  config,
  logger,
  internal,
  hass,
  synapse,
}: TServiceParams) {
  const { is } = internal.utils;
  let configured = false;

  function uniqueProperties(): string[] {
    return [hostname(), userInfo().username, internal.boot.application.name];
  }

  /**
   * Health sensor will always exist for this app, and has a hard coded attribute
   */
  function isRegistered() {
    const state = hass.device.current.some(
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      device => String(device?.identifiers?.[0]?.[1]) === config.synapse.METADATA_UNIQUE_ID,
    );

    if (!configured && state) {
      configured = true;
      logger.info("application confirmed registration");
    } else if (configured && !state) {
      configured = false;
      logger.info("application registration deleted");
    }
    return state;
  }

  // setting up the default that can't be declared at the module level
  lifecycle.onPreInit(() => {
    if (is.empty(config.synapse.METADATA_TITLE)) {
      const { name } = internal.boot.application;
      logger.debug({ METADATA_TITLE: name, name: "onPreInit" }, `updating [METADATA_TITLE]`);
      internal.boilerplate.configuration.set("synapse", "METADATA_TITLE", name);
    }
    if (is.empty(config.synapse.METADATA_UNIQUE_ID)) {
      const METADATA_UNIQUE_ID = createHash("md5")
        .update(uniqueProperties().join("-"))
        .digest("hex");
      logger.debug({ METADATA_UNIQUE_ID, name: "onPreInit" }, `updating [METADATA_UNIQUE_ID]`);
      internal.boilerplate.configuration.set("synapse", "METADATA_UNIQUE_ID", METADATA_UNIQUE_ID);
    }
  });

  /**
   * keep bothering user until they install the extension or remove the lib
   * kinda pointless otherwise
   */
  async function checkInstallState() {
    const hassConfig = await hass.fetch.getConfig();
    const installed = hassConfig.components.some(i => i.startsWith("synapse"));
    if (installed) {
      logger.debug("extension is installed");
      if (isRegistered()) {
        logger.debug("app already configured in hass");
        configured = true;
      }
      return true;
    }
    logger.error(`synapse extension is not installed`);
    return false;
  }

  // hass.events.
  // make sure it doesn't accidentally get attached to lifecycle
  lifecycle.onBootstrap(async () => await synapse.configure.checkInstallState());

  lifecycle.onReady(() => {
    if (synapse.configure.isRegistered()) {
      logger.trace("detected installed addon");
    } else {
      logger.warn({ name: "onReady" }, `application is not registered in hass`);
    }
  });

  return { checkInstallState, isRegistered };
}
