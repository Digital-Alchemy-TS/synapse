import type { TContext } from "@digital-alchemy/core";
import type {
  ResponseOptional,
  ServiceListField,
  ServiceListFieldDescription,
  ServiceListSelector,
  ServiceListServiceTarget,
} from "@digital-alchemy/hass";

import type { inferSymbol } from "./utils.mts";

export type UnknownObject = Record<string, unknown>;

/**
 * Processes nested fields within an object selector.
 * Object selectors have a different structure where fields contain selectors directly.
 */
type ProcessObjectFields<
  FIELDS extends Record<
    string,
    {
      selector: {
        [K in keyof ServiceListSelector]: {
          [P in K]: ServiceListSelector[K];
        } & {
          [P in Exclude<keyof ServiceListSelector, K>]?: never;
        };
      }[keyof ServiceListSelector];
      required?: boolean;
      label?: string;
    }
  >,
> = {
  [K in keyof FIELDS]: FIELDS[K] extends { selector: infer FIELD_SELECTOR }
    ? FIELD_SELECTOR extends ServiceListFieldDescription
      ? ExtractBrandedType<FIELD_SELECTOR>
      : unknown
    : unknown;
};

/**
 * Extracts the branded type from a field description using the inferSymbol.
 * The branded type contains 100% of the field's type information.
 */
type ExtractBrandedType<FIELD> =
  FIELD extends Record<inferSymbol, infer BRANDED> ? BRANDED : unknown;

/**
 * Processes a single field value by extracting the branded type.
 * Handles object selectors with nested fields recursively.
 */
type ProcessFieldValue<FIELD extends ServiceListFieldDescription> = FIELD["selector"] extends {
  object: { fields?: infer FIELDS };
}
  ? FIELDS extends Record<
      string,
      {
        selector: {
          [K in keyof ServiceListSelector]: {
            [P in K]: ServiceListSelector[K];
          } & {
            [P in Exclude<keyof ServiceListSelector, K>]?: never;
          };
        }[keyof ServiceListSelector];
        required?: boolean;
        label?: string;
      }
    >
    ? ProcessObjectFields<FIELDS>
    : ExtractBrandedType<FIELD>
  : ExtractBrandedType<FIELD>;

/**
 * Transforms a FieldList schema into a typed data object for service callbacks.
 * Each field in the schema is processed to determine its value type based on its selector.
 */
export type BuildServiceData<FIELDS extends FieldList> = {
  [K in keyof FIELDS]: ProcessFieldValue<FIELDS[K]>;
};

export type SynapseServiceReturn = {
  create: SynapseServiceCreate;
  fields: {
    //
  };
};

export type SynapseServiceCreate = <OPTIONS extends SynapseServiceCreateOptions<FieldList>>(
  options: OPTIONS,
  callback: SynapseServiceCreateCallback<
    BuildServiceData<
      OPTIONS extends { fields: infer FIELDS } ? (FIELDS extends FieldList ? FIELDS : never) : never
    >
  >,
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

export type BuildSynapseServiceRequestData<FIELDS extends FieldList = FieldList> = {
  [NAME in keyof FIELDS]: unknown;
};

export type SynapseServiceCreateCallback<DATA extends UnknownObject = UnknownObject> = (
  data: DATA,
) => void | Promise<void>;

export type SynapseServiceListField = Omit<ServiceListField, "name">;

export type ServiceCallData<DATA extends UnknownObject = UnknownObject> = {
  id: `service_call_${number}`;
  service_data: DATA;
  service_name: string;
  service_unique_id: string;
  type: "synapse/service/call";
};
