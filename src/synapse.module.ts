import { CreateLibrary, InternalConfig } from "@digital-alchemy/core";
import { LIB_FASTIFY } from "@digital-alchemy/fastify-extension";
import { LIB_HASS } from "@digital-alchemy/hass";

import {
  BinarySensor,
  BonjourExtension,
  Configure,
  Controller,
  DeviceExtension,
  NumberDomain,
  Registry,
  Scene,
  Sensor,
  Switch,
  ValueStorage,
  VirtualButton,
} from "./extensions";
import { HassDeviceMetadata } from "./helpers";

export const LIB_SYNAPSE = CreateLibrary({
  configuration: {
    EMIT_HEARTBEAT: {
      default: true,
      description: [
        "Emit a heartbeat pulse so the extension knows the service is alive",
      ],
      type: "boolean",
    },
    EVENT_NAMESPACE: {
      default: "digital_alchemy",
      description: [
        "You almost definitely do not want to change this",
        "Must be matched on the python integration side",
      ],
      type: "string",
    },
    HEARTBEAT_INTERVAL: {
      default: 5,
      description: "Seconds between heartbeats",
      type: "number",
    },
    METADATA: {
      description: [
        "A string to uniquely identify this application",
        "Should be unique within home assistant, such as a uuid",
        "Default value calculated from hostname + username + app_name",
      ],
      type: "internal",
    } as InternalConfig<HassDeviceMetadata>,
    METADATA_HOST: {
      description: ["Host name to announce as"],
      type: "string",
    },
    METADATA_TITLE: {
      description: [
        "Title for the integration provided by this app",
        "Defaults to app name",
      ],
      type: "string",
    },
    METADATA_UNIQUE_ID: {
      description: [
        "A string to uniquely identify this application",
        "Should be unique within home assistant, such as a uuid",
        "Default value calculated from hostname + username + app_name",
      ],
      type: "string",
    },
    PUBLISH_BONJOUR: {
      default: true,
      type: "boolean",
    },
  },
  depends: [LIB_HASS, LIB_FASTIFY],
  name: "synapse",
  priorityInit: ["registry", "storage"],
  services: {
    /**
     * create `binary_sensor` domain entities
     */
    binary_sensor: BinarySensor,

    /**
     * Zeroconf discovery
     */
    bonjour: BonjourExtension,

    /**
     * create `button` domain entities
     *
     * run callback on activation
     */
    button: VirtualButton,

    /**
     *
     */
    configure: Configure,

    /**
     * fastify bindings
     */
    controller: Controller,

    /**
     *
     */
    device: DeviceExtension,

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
