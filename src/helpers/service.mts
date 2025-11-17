import type { TContext } from "@digital-alchemy/core";
import type {
  ResponseOptional,
  ServiceListField,
  ServiceListFieldDescription,
  ServiceListSelector,
  ServiceListServiceTarget,
} from "@digital-alchemy/hass";

export type UnknownObject = Record<string, unknown>;

/**
 * Maps each selector type to its corresponding value type when used as service call data.
 * This registry defines what type of value each selector accepts.
 */
type SelectorValueTypeMap = {
  action: string;
  addon: { name?: string; slug?: string };
  area: string | string[];
  attribute: Record<string, unknown>;
  assist_pipeline: string;
  backup_location: string;
  boolean: boolean;
  color_rgb: [number, number, number];
  color_temp: number;
  condition: unknown;
  config_entry: string;
  constant: string | number | boolean;
  conversation_agent: string;
  country: string | string[];
  date: string;
  datetime: string;
  device: string | string[];
  duration: string | number;
  entity: string | string[];
  file: string;
  floor: string | string[];
  icon: string;
  label: string | string[];
  language: string;
  location: { latitude: number; longitude: number; radius?: number };
  media: string | string[];
  number: number;
  object: Record<string, unknown>;
  qr_code: string;
  select: string | string[];
  state: string | string[];
  statistic: string | string[];
  target: { entity_id?: string | string[]; device_id?: string | string[] };
  template: string;
  text: string | string[];
  theme: string;
  time: string;
  trigger: unknown;
};

/**
 * Extracts the selector type key from a ServiceListFieldDescription.
 * Returns the key of ServiceListSelector that is present in the selector field.
 * The selector is a discriminated union, so we check which key exists and matches.
 */
type ExtractSelectorType<FIELD extends ServiceListFieldDescription> =
  FIELD["selector"] extends infer SELECTOR
    ? SELECTOR extends Record<string, unknown>
      ? {
          [K in keyof ServiceListSelector]: SELECTOR extends Record<K, unknown>
            ? SELECTOR[K] extends ServiceListSelector[K]
              ? K
              : never
            : never;
        }[keyof ServiceListSelector]
      : never
    : never;

/**
 * Processes a selector directly (used for object selector nested fields).
 * Extracts the selector type from the discriminated union and maps it to its value type.
 */
type ProcessSelectorValue<SELECTOR> = SELECTOR extends infer S
  ? {
      [K in keyof ServiceListSelector]: S extends { [P in K]: ServiceListSelector[K] } ? K : never;
    }[keyof ServiceListSelector] extends infer KEY
    ? KEY extends keyof SelectorValueTypeMap
      ? SelectorValueTypeMap[KEY]
      : unknown
    : unknown
  : unknown;

/**
 * Processes nested fields within an object selector.
 * Object selectors have a different structure where fields contain selectors directly.
 * The selector is a discriminated union, so we process it to extract the value type.
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
  [K in keyof FIELDS]: ProcessSelectorValue<FIELDS[K]["selector"]>;
};

/**
 * Processes a single field value based on its selector type.
 * Handles object selectors with nested fields recursively.
 */
type ProcessFieldValue<FIELD extends ServiceListFieldDescription> =
  FIELD["selector"] extends infer SELECTOR
    ? SELECTOR extends { object: { fields?: infer FIELDS } }
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
        : Record<string, unknown>
      : ExtractSelectorType<FIELD> extends keyof SelectorValueTypeMap
        ? SelectorValueTypeMap[ExtractSelectorType<FIELD>]
        : unknown
    : unknown;

/**
 * Transforms a FieldList schema into a typed data object for service callbacks.
 * Each field in the schema is processed to determine its value type based on its selector.
 */
export type BuildServiceData<FIELDS extends FieldList> = {
  [K in keyof FIELDS]: ProcessFieldValue<FIELDS[K]>;
};

/**
 * Helper type to extract the fields schema from options for type inference.
 * This allows TypeScript to infer the schema type from the fields property.
 */
type InferSchemaFromOptions<OPTIONS> = OPTIONS extends { fields: infer FIELDS }
  ? FIELDS extends FieldList
    ? FIELDS
    : FieldList
  : OPTIONS extends { fields?: infer FIELDS }
    ? FIELDS extends FieldList
      ? FIELDS
      : FieldList
    : FieldList;

export type SynapseServiceCreate = <
  OPTIONS extends SynapseServiceCreateOptions<FieldList> = SynapseServiceCreateOptions<FieldList>,
>(
  options: OPTIONS,
  callback: SynapseServiceCreateCallback<BuildServiceData<InferSchemaFromOptions<OPTIONS>>>,
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
