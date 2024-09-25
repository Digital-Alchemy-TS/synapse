import { CreateLibrary, InternalConfig } from "@digital-alchemy/core";
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
  SynapseLocals,
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
  /**
   * ### Customize date type
   *
   * Provides `YYYY-MM-DD` format by default
   *
   * > Available options: `iso` | `date` | `dayjs`
   *
   * ```typescript
   * synapse.date<{ date_type: "dayjs" }>({ ... })
   * ```
   */
  date: VirtualDate,
  /**
   * ### Customize datetime type
   *
   * > Available options: `iso` | `date` | `dayjs`
   *
   * ```typescript
   * synapse.datetime<{ date_type: "dayjs" }>({ ... })
   * ```
   */
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
  /**
   * ### Customize state
   *
   * > Available options: `number` | `string`
   *
   * ```typescript
   * synapse.sensor<{ state: number }>({ ... })
   * ```
   */
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
    EMIT_HEARTBEAT: {
      default: true,
      description: [
        "Emit a heartbeat pulse so the extension knows the service is alive",
        "Disable for tests",
      ],
      type: "boolean",
    },
    EVENT_NAMESPACE: {
      default: "digital_alchemy",
      description: [
        "You almost definitely do not want to change this",
        "Must be matched on the python integration side (probably don't change this)",
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
  },
  depends: [LIB_HASS],
  name: "synapse",
  priorityInit: ["generator", "storage", "locals"],
  services: {
    /**
     * @internal
     */
    configure: Configure,

    /**
     * Internal tools to create the device that registers with entities
     */
    device: DeviceExtension,

    /**
     * @internal
     *
     * Discovery features
     */
    discovery: DiscoveryExtension,

    /**
     * @internal
     *
     * Used to assist creation of domains
     */
    generator: DomainGenerator,

    /**
     * @internal
     *
     * Used to power `synapseEntity.locals`
     */
    locals: SynapseLocals,

    /**
     * @internal
     */
    socket: SocketExtension,

    /**
     * @internal
     *
     * Used to persist entity state
     */
    sqlite: SQLite,

    /**
     * @internal
     */
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
