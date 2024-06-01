import { TServiceParams } from "@digital-alchemy/core";
import { hostname, userInfo } from "os";

import { SynapseDescribeResponse } from "../helpers";

export function Controller({ fastify, config, synapse, logger, internal }: TServiceParams) {
  const getIdentifier = () => internal.boot.application.name;

  fastify.routes(server => {
    server.get("/synapse", (): SynapseDescribeResponse => {
      logger.info(`describe app`);
      return {
        app: getIdentifier(),
        device: synapse.device.getInfo(),
        host: config.synapse.METADATA_HOST,
        hostname: hostname(),
        title: config.synapse.METADATA_TITLE,
        unique_id: config.synapse.METADATA_UNIQUE_ID,
        username: userInfo().username,
        ...synapse.registry.buildEntityState(),
      };
    });
  });
}
