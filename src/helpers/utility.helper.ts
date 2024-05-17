import { TAreaId } from "@digital-alchemy/hass";

export type OnOff = "on" | "off" | "unavailable";

export interface ISynapseBrand {
  _synapse: symbol;
}

export type TSynapseId = string & ISynapseBrand;
export const STORAGE_BOOTSTRAP_PRIORITY = 1;

export type SynapseDescribeResponse = {
  hostname: string;
  app: string;
  meta: HassDeviceMetadata;
  unique_id: string;
  username: string;
};

export type HassDeviceMetadata = {
  /**
   * A URL on which the device or service can be configured, linking to paths inside the Home Assistant UI can be done by using `homeassistant://<path>`.
   */
  configuration_url?: string;
  /**
   * The manufacturer of the device, will be overridden if `manufacturer` is set. Useful for example for an integration showing all devices on the network.
   */
  default_manufacturer?: string;
  /**
   * The model of the device, will be overridden if `model` is set. Useful for example for an integration showing all devices on the network.
   */
  default_model?: string;
  /**
   * Default name of this device, will be overridden if `name` is set. Useful for example for an integration showing all devices on the network.
   */
  default_name?: string;
  /**
   * The hardware version of the device.
   */
  hw_version?: string;
  /**
   * The serial number of the device. Unlike a serial number in the `identifiers` set, this does not need to be unique.
   */
  serial_number?: string;
  /**
   * The suggested name for the area where the device is located.
   */
  suggested_area?: TAreaId;
  /**
   * The firmware version of the device.
   */
  sw_version?: string;
};

export type SynapseStateResponse = {
  //
};
