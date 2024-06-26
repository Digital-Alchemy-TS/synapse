import { CreateLibrary, InternalConfig } from "@digital-alchemy/core";
import { LIB_FASTIFY } from "@digital-alchemy/fastify-extension";
import { LIB_HASS } from "@digital-alchemy/hass";
import { join } from "path";
import { cwd } from "process";

import {
  Configure,
  DeviceExtension,
  DiscoveryExtension,
  DomainGenerator,
  SocketExtension,
  StorageExtension,
  VirtualAlarmControlPanel,
  VirtualBinarySensor,
  VirtualButton,
  VirtualCamera,
  VirtualClimate,
  VirtualCover,
  VirtualDate,
  VirtualDateTime,
  VirtualFan,
  VirtualImage,
  VirtualLawnMower,
  VirtualLight,
  VirtualLock,
  VirtualMediaPlayer,
  VirtualNotify,
  VirtualNumber,
  VirtualRemote,
  VirtualScene,
  VirtualSelect,
  VirtualSensor,
  VirtualSiren,
  VirtualSwitch,
  VirtualText,
  VirtualTime,
  VirtualTodoList,
  VirtualUpdate,
  VirtualVacuum,
  VirtualValve,
  VirtualWaterHeater,
} from "./extensions";
import { SQLite } from "./extensions/sqlite.extension";
import { HassDeviceMetadata } from "./helpers";

const DOMAINS = {
  alarm_control_panel: VirtualAlarmControlPanel,
  binary_sensor: VirtualBinarySensor,
  button: VirtualButton,
  camera: VirtualCamera,
  climate: VirtualClimate,
  cover: VirtualCover,
  date: VirtualDate,
  datetime: VirtualDateTime,
  fan: VirtualFan,
  image: VirtualImage,
  lawn_mower: VirtualLawnMower,
  light: VirtualLight,
  lock: VirtualLock,
  media_player: VirtualMediaPlayer,
  notify: VirtualNotify,
  number: VirtualNumber,
  remote: VirtualRemote,
  scene: VirtualScene,
  select: VirtualSelect,
  sensor: VirtualSensor,
  siren: VirtualSiren,
  switch: VirtualSwitch,
  text: VirtualText,
  time: VirtualTime,
  todo_list: VirtualTodoList,
  update: VirtualUpdate,
  vacuum: VirtualVacuum,
  valve: VirtualValve,
  water_heater: VirtualWaterHeater,
};

export const LIB_SYNAPSE = CreateLibrary({
  configuration: {
    DEVICE_TYPE: {
      default: "urn:schemas-upnp-org:device:Basic:1",
      type: "string",
    },
    EMIT_HEARTBEAT: {
      default: true,
      description: ["Emit a heartbeat pulse so the extension knows the service is alive"],
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
      description: "Extra data to describe the app + build default device from",
      type: "internal",
    } as InternalConfig<HassDeviceMetadata>,
    METADATA_HOST: {
      description: ["Host name to announce as"],
      type: "string",
    },
    METADATA_TITLE: {
      description: ["Title for the integration provided by this app", "Defaults to app name"],
      type: "string",
    },
    METADATA_UNIQUE_ID: {
      description: ["A string to uniquely identify this application", "Should be uuid or md5 sum"],
      type: "string",
    },
    SQLITE_DB: {
      default: join(cwd(), "synapse_storage.db"),
      description: "Location to persist entity state at",
      type: "string",
    },
    SSDP_PATH: {
      default: "/description.xml",
      description: "Route to advertise ssdp xml data at",
      type: "string",
    },
  },
  depends: [LIB_HASS],
  name: "synapse",
  optionalDepends: [LIB_FASTIFY],
  priorityInit: ["generator", "storage"],
  services: {
    /**
     * internal
     */
    configure: Configure,

    /**
     * Internal tools to create the device that registers with entities
     */
    device: DeviceExtension,

    /**
     * Zeroconf discovery
     */
    discovery: DiscoveryExtension,
    generator: DomainGenerator,

    socket: SocketExtension,
    sqlite: SQLite,
    storage: StorageExtension,
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
