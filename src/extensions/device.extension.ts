import { TServiceParams } from "@digital-alchemy/core";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { HassDeviceMetadata, TSynapseDeviceId } from "../helpers";

export function DeviceExtension({ config, lifecycle, logger, internal }: TServiceParams) {
  let synapseVersion: string;
  const DEVICE_REGISTRY = new Map<string, HassDeviceMetadata>();

  lifecycle.onPostConfig(() => {
    const file = join(__dirname, "..", "..", "package.json");
    if (existsSync(file)) {
      logger.trace("loading package");
      try {
        const contents = readFileSync(file, "utf8");
        const data = JSON.parse(contents) as { version: string };
        synapseVersion = data?.version;
      } catch (error) {
        logger.error(error);
      }
    }
  });

  return {
    getInfo(): HassDeviceMetadata {
      return {
        manufacturer: "Digital Alchemy",
        name: internal.boot.application.name,
        sw_version: synapseVersion,
        ...config.synapse.METADATA,
      };
    },
    list() {
      return [...DEVICE_REGISTRY.keys()].map(unique_id => ({
        ...DEVICE_REGISTRY.get(unique_id),
        hub_id: config.synapse.METADATA_UNIQUE_ID,
        unique_id,
      }));
    },
    register(id: string, data: HassDeviceMetadata): TSynapseDeviceId {
      DEVICE_REGISTRY.set(id, data);
      return id as TSynapseDeviceId;
    },
  };
}
