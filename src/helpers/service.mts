import type { TContext } from "@digital-alchemy/core";
import type { ServiceListField } from "@digital-alchemy/hass";

export type SynapseServiceCreate<SCHEMA extends SynapseServiceListField = SynapseServiceListField> =
  (options: SynapseServiceCreateOptions<SCHEMA>, callback: SynapseServiceCreateCallback) => void;

export type SynapseServiceCreateOptions<SCHEMA extends SynapseServiceListField> = {
  context: TContext;
  name: string;
  schema: SCHEMA;
};

export type SynapseServiceCreateCallback = () => void | Promise<void>;

export type SynapseServiceListField = Omit<ServiceListField, "name">;
