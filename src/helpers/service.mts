import type { TContext } from "@digital-alchemy/core";
import type {
  ResponseOptional,
  ServiceListField,
  ServiceListFieldDescription,
  ServiceListServiceTarget,
} from "@digital-alchemy/hass";

export type UnknownObject = Record<string, unknown>;

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

export type BuildSynapseServiceRequestData<
  OPTIONS extends SynapseServiceCreateOptions<FIELDS>,
  FIELDS extends FieldList = FieldList,
> = {
  [NAME in keyof FIELDS]: unknown;
};

export type SynapseServiceCreateCallback = (data: UnknownObject) => void | Promise<void>;

export type SynapseServiceListField = Omit<ServiceListField, "name">;

export type ServiceCallData<DATA extends UnknownObject = UnknownObject> = {
  id: `service_call_${number}`;
  service_data: DATA;
  service_name: string;
  service_unique_id: string;
  type: "synapse/service/call";
};
