import { TServiceParams } from "@digital-alchemy/core";
import { hostname, userInfo } from "os";

import { SynapseDescribeResponse } from "../helpers";

export function Controller({
  fastify,
  config,
  synapse,
  logger,
  internal,
}: TServiceParams) {
  fastify.routes(server => {
    server.get("/synapse", (): SynapseDescribeResponse => {
      logger.info(`describe app`);
      return {
        app: internal.boot.application.name,
        hostname: hostname(),
        meta: config.synapse.METADATA,
        unique_id: config.synapse.METADATA_UNIQUE_ID,
        username: userInfo().username,
      };
    });

    server.get("/synapse/configuration", () =>
      synapse.registry.buildEntityState(),
    );
  });
}
