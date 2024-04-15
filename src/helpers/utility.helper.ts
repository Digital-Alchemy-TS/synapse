export type OnOff = "on" | "off" | "unavailable";

export interface ISynapseBrand {
  _synapse: symbol;
}

export type TSynapseId = string & ISynapseBrand;
export const STORAGE_BOOTSTRAP_PRIORITY = 1;
