import { TServiceParams } from "@digital-alchemy/core";
import { hostname, userInfo } from "os";

import { SynapseDescribeResponse } from "../helpers";

export function Controller({ fastify, config, synapse, logger, internal }: TServiceParams) {
  fastify.routes(server => {
    server.get("/synapse", (): SynapseDescribeResponse => {
      logger.info(`describe app`);
      return {
        app: internal.boot.application.name,
        device: synapse.device.getInfo(),
        host: config.synapse.METADATA_HOST,
        hostname: hostname(),
        secondary_devices: synapse.device.list(),
        title: config.synapse.METADATA_TITLE,
        unique_id: config.synapse.METADATA_UNIQUE_ID,
        username: userInfo().username,
        ...synapse.storage.dump(),
      };
    });
  });
}
