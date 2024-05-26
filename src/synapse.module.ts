import { CreateLibrary, InternalConfig } from "@digital-alchemy/core";
import { LIB_FASTIFY } from "@digital-alchemy/fastify-extension";
import { LIB_HASS } from "@digital-alchemy/hass";

import {
  BonjourExtension,
  Configure,
  Controller,
  DeviceExtension,
  Registry,
  ValueStorage,
  VirtualAlarmControlPanel,
  VirtualBinarySensor,
  VirtualButton,
  VirtualClimate,
  VirtualCover,
  VirtualDate,
  VirtualDateTime,
  VirtualFan,
  VirtualLawnMower,
  VirtualLight,
  VirtualLock,
  VirtualMediaPlayer,
  VirtualNotify,
  VirtualNumber,
  VirtualScene,
  VirtualSelect,
  VirtualSensor,
  VirtualSiren,
  VirtualSwitch,
  VirtualText,
  VirtualTime,
  VirtualUpdate,
  VirtualVacuum,
  VirtualValve,
  VirtualWaterHeater,
} from "./extensions";
import { HassDeviceMetadata } from "./helpers";

const DOMAINS = {
  alarm_control_panel: VirtualAlarmControlPanel,
  binary_sensor: VirtualBinarySensor,
  button: VirtualButton,
  climate: VirtualClimate,
  cover: VirtualCover,
  date: VirtualDate,
  datetime: VirtualDateTime,
  fan: VirtualFan,
  lawn_mower: VirtualLawnMower,
  light: VirtualLight,
  lock: VirtualLock,
  media_player: VirtualMediaPlayer,
  notify: VirtualNotify,
  number: VirtualNumber,
  scene: VirtualScene,
  select: VirtualSelect,
  sensor: VirtualSensor,
  siren: VirtualSiren,
  switch: VirtualSwitch,
  text: VirtualText,
  time: VirtualTime,
  update: VirtualUpdate,
  vacuum: VirtualVacuum,
  valve: VirtualValve,
  water_heater: VirtualWaterHeater,
};

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
     * Zeroconf discovery
     */
    bonjour: BonjourExtension,

    /**
     * internal
     */
    configure: Configure,

    /**
     * fastify bindings
     */
    controller: Controller,

    /**
     * Internal tools to create the device that registers with entities
     */
    device: DeviceExtension,

    /**
     * internal tools for managing entities
     */
    registry: Registry,

    /**
     * Logic for sour
     */
    storage: ValueStorage,
    ...DOMAINS,
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
