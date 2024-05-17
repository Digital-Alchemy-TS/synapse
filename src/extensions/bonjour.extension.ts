import { is, TServiceParams } from "@digital-alchemy/core";
import Bonjour from "bonjour";
import { createHash } from "crypto";
import { hostname, userInfo } from "os";

export function BonjourExtension({
  config,
  lifecycle,
  logger,
  internal,
}: TServiceParams) {
  let bonjour: Bonjour.Bonjour;
  function uniqueProperties(): string[] {
    return [hostname(), userInfo().username, internal.boot.application.name];
  }

  // Create a UNIQUE_ID, if one is not provided via .bootstrap()
  lifecycle.onPreInit(() => {
    if (is.empty(config.synapse.METADATA_UNIQUE_ID)) {
      internal.boilerplate.configuration.set(
        "synapse",
        "METADATA_UNIQUE_ID",
        createHash("md5").update(uniqueProperties().join("-")).digest("hex"),
      );
    }
  });

  lifecycle.onReady(() => {
    logger.info("WAT");
  });

  lifecycle.onPostConfig(() => {
    if (!config.synapse.PUBLISH_BONJOUR) {
      return;
    }
    logger.info({ name: "onPostConfig" }, `publishing`);
    bonjour = Bonjour();
    bonjour.publish({
      name: internal.boot.application.name,
      port: config.fastify.PORT,
      txt: { UNIQUE_ID: config.synapse.METADATA_UNIQUE_ID },
      type: "_da_synapse.tcp",
    });
  });

  lifecycle.onShutdownStart(() => {
    bonjour?.destroy();
  });
}
