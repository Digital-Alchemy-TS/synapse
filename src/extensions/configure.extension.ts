import { is, MINUTE, sleep, TServiceParams } from "@digital-alchemy/core";
import { createHash } from "crypto";
import { hostname, networkInterfaces, userInfo } from "os";

const EXTRA_EARLY = 1000;

export function Configure({ lifecycle, config, logger, internal, hass, synapse }: TServiceParams) {
  let extensionInstalled = false;

  function uniqueProperties(): string[] {
    return [hostname(), userInfo().username, internal.boot.application.name];
  }

  function isRegistered() {
    return (
      extensionInstalled &&
      hass.device.current.some(
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        device => String(device?.identifiers?.[0]?.[1]) === config.synapse.METADATA_UNIQUE_ID,
      )
    );
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
  async function doCheck() {
    if (!config.hass.AUTO_SCAN_CALL_PROXY) {
      extensionInstalled = true;
      return;
    }
    const hassConfig = await hass.fetch.getConfig();
    const installed = hassConfig.components.some(i => i.startsWith("synapse"));
    if (installed) {
      logger.debug("extension is installed!");
      extensionInstalled = true;
      return;
    }
    logger.error(`synapse extension is not installed`);
    await sleep(MINUTE);
    return doCheck();
  }

  // make sure it doesn't accidentally get attached to lifecycle
  lifecycle.onBootstrap(() => setImmediate(async () => await doCheck()));

  lifecycle.onReady(() => {
    if (!synapse.configure.isRegistered()) {
      logger.warn({ name: "onReady" }, `application is not registered in hass`);
    }
  });

  return { isRegistered };
}
