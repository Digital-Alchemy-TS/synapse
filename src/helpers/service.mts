import type { TContext } from "@digital-alchemy/core";
import type {
  ResponseOptional,
  ServiceListField,
  ServiceListFieldDescription,
  ServiceListServiceTarget,
} from "@digital-alchemy/hass";

export type SynapseServiceCreate<SCHEMA extends FieldList = FieldList> = (
  options: SynapseServiceCreateOptions<SCHEMA>,
  callback: SynapseServiceCreateCallback,
) => void;

export type SynapseServiceCreateOptions<FIELDS extends FieldList = FieldList> = {
  context: TContext;
  name: string;
  description?: string;
  domain?: string;
  unique_id?: string;
  fields?: FIELDS;
  target?: ServiceListServiceTarget;
  response?: ResponseOptional;
};

export type FieldList = Record<string, ServiceListFieldDescription>;

export type SynapseServiceCreateCallback = (data: Record<string, unknown>) => void | Promise<void>;

export type SynapseServiceListField = Omit<ServiceListField, "name">;

export const SERVICE_CALL_EVENT = (event_name: string) => `synapse/service_call/${event_name}`;
