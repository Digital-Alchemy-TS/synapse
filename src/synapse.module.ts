import { CreateLibrary, StringConfig } from "@digital-alchemy/core";
import { LIB_HASS } from "@digital-alchemy/hass";

import {
  BinarySensor,
  Button,
  NumberDomain,
  Registry,
  Scene,
  Sensor,
  Switch,
  ValueStorage,
} from "./extensions";

enum StorageTypes {
  none = "none",
  cache = "cache",
  file = "file",
  external = "external",
}

export const LIB_SYNAPSE = CreateLibrary({
  configuration: {
    ANNOUNCE_AT_CONNECT: {
      default: false,
      description: [
        "Emit the entity list update every time this application is booted",
        "digital-alchemy.reload() service available for manual reload",
      ],
      type: "boolean",
    },
    APPLICATION_IDENTIFIER: {
      description: [
        "Used to generate unique ids in home assistant",
        "Defaults to application name",
      ],
      type: "string",
    },
    EMIT_HEARTBEAT: {
      default: true,
      description: ["Emit a pulse so the extension knows the service is alive"],
      type: "boolean",
    },
    HEARTBEAT_INTERVAL: {
      default: 5,
      description: "Seconds between heartbeats",
      type: "number",
    },
    STORAGE: {
      default: "cache",
      description: "Persistence type",
      enum: Object.values(StorageTypes),
      type: "string",
    } as StringConfig<`${StorageTypes}`>,
    STORAGE_FILE_LOCATION: {
      description:
        "If using file storage, a base folder to store data at is required. Defaults to ~/.config/{app_name}/",
      type: "string",
    },
  },
  depends: [LIB_HASS],
  name: "synapse",
  priorityInit: ["registry", "storage"],
  services: {
    /**
     * create `binary_sensor` domain entities
     */
    binary_sensor: BinarySensor,

    /**
     * create `button` domain entities
     *
     * run callback on activation
     */
    button: Button,

    /**
     * create `number` domain entities
     */
    number: NumberDomain,

    /**
     * internal tools for managing entities
     */
    registry: Registry,

    /**
     * create `scene` domain entities
     *
     * run callback on activation
     */
    scene: Scene,

    /**
     * create `sensor` domain entities
     */
    sensor: Sensor,

    /**
     * Logic for sour
     */
    storage: ValueStorage,

    /**
     * create `switch` domain entities
     */
    switch: Switch,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    /**
     * tools for creating new entities within home assistant
     */
    synapse: typeof LIB_SYNAPSE;
  }
}
