import type { TContext } from "@digital-alchemy/core";
import type {
  ALL_DOMAINS,
  PICK_ENTITY,
  PICK_FROM_PLATFORM,
  ResponseOptional,
  ServiceListField,
  ServiceListFieldDescription,
  ServiceListSelector,
  ServiceListServiceTarget,
  TAreaId,
  TDeviceId,
  TLabelId,
  TPlatformId,
} from "@digital-alchemy/hass";

import type { inferSymbol } from "./utils.mts";
import type { ExtractDomainUnion } from "./utils.mts";

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

/**
 * Extracts the entity type from a single EntityFilterSelector.
 * If integration and domain are provided, uses PICK_FROM_PLATFORM.
 * If only domain is provided, uses PICK_ENTITY with domain.
 * Otherwise, defaults to PICK_ENTITY.
 */
type ExtractEntityTypeFromFilter<FILTER> = FILTER extends {
  integration: infer INTEGRATION;
  domain: infer DOMAIN;
}
  ? INTEGRATION extends TPlatformId
    ? DOMAIN extends ALL_DOMAINS | ALL_DOMAINS[]
      ? PICK_FROM_PLATFORM<INTEGRATION, ExtractDomainUnion<DOMAIN>>
      : PICK_ENTITY
    : PICK_ENTITY
  : FILTER extends { domain: infer DOMAIN }
    ? DOMAIN extends ALL_DOMAINS | ALL_DOMAINS[]
      ? PICK_ENTITY<ExtractDomainUnion<DOMAIN>>
      : PICK_ENTITY
    : PICK_ENTITY;

/**
 * Extracts the entity type from target.entity based on integration and domain.
 * Handles both single EntityFilterSelector and array cases.
 */
type ExtractEntityTypeFromTarget<TARGET extends ServiceListServiceTarget> = TARGET extends {
  entity: infer ENTITY_FILTER;
}
  ? ENTITY_FILTER extends readonly (infer FILTER)[]
    ? ExtractEntityTypeFromFilter<FILTER>
    : ExtractEntityTypeFromFilter<ENTITY_FILTER>
  : PICK_ENTITY;

/**
 * Service data type that includes entity_id when target is defined.
 * Merges field data with entity_id array, narrowed based on target.entity.
 */
export type BuildServiceDataWithTarget<
  FIELDS extends FieldList,
  TARGET extends ServiceListServiceTarget = ServiceListServiceTarget,
> = BuildServiceData<FIELDS> & {
  entity_id?: ExtractEntityTypeFromTarget<TARGET> | ExtractEntityTypeFromTarget<TARGET>[];
  device_id?: TDeviceId | TDeviceId[];
  label_id?: TLabelId | TLabelId[];
  area_id?: TAreaId | TAreaId[];
};

export type SynapseServiceReturn = {
  create: SynapseServiceCreate;
  fields: {
    //
  };
};

type HasTargetOverrideKey<FIELDS extends FieldList> =
  Extract<keyof FIELDS, TargetOverrideKeys> extends never ? false : true;

/**
 * Extracts the fields type from options.
 */
type ExtractFieldsFromOptionsType<OPTIONS> = OPTIONS extends { fields: infer FIELDS }
  ? FIELDS extends FieldList
    ? FIELDS
    : FieldList
  : FieldList;

export type ValidateServiceOptions<
  FIELDS extends FieldList,
  OPTIONS extends SynapseServiceCreateOptions<FIELDS>,
> = OPTIONS extends { target: ServiceListServiceTarget }
  ? HasTargetOverrideKey<ExtractFieldsFromOptionsType<OPTIONS>> extends true
    ? never
    : OPTIONS
  : OPTIONS;

/**
 * Extracts the actual fields type from validated options.
 * When target is present, fields are FieldsWithoutTargetOverrides<FIELDS>.
 */
type ExtractFieldsFromOptions<
  FIELDS extends FieldList,
  OPTIONS extends ValidateServiceOptions<FIELDS, SynapseServiceCreateOptions<FIELDS>>,
> = OPTIONS extends { fields: infer ACTUAL_FIELDS }
  ? ACTUAL_FIELDS extends FieldList
    ? ACTUAL_FIELDS
    : FIELDS
  : FIELDS;

export type SynapseServiceCreate = <
  FIELDS extends FieldList = FieldList,
  OPTIONS extends SynapseServiceCreateOptions<FIELDS> = SynapseServiceCreateOptions<FIELDS>,
>(
  options: ValidateServiceOptions<FIELDS, OPTIONS>,
  callback: SynapseServiceCreateCallback<
    OPTIONS extends {
      target: infer TARGET;
    }
      ? TARGET extends ServiceListServiceTarget
        ? BuildServiceDataWithTarget<
            ExtractFieldsFromOptions<FIELDS, ValidateServiceOptions<FIELDS, OPTIONS>>,
            TARGET
          >
        : BuildServiceData<
            ExtractFieldsFromOptions<FIELDS, ValidateServiceOptions<FIELDS, OPTIONS>>
          >
      : BuildServiceData<ExtractFieldsFromOptions<FIELDS, ValidateServiceOptions<FIELDS, OPTIONS>>>
  >,
) => void;

type TargetOverrideKeys = "entity_id" | "label_id" | "device_id" | "area_id";

export type FieldList = Record<string, ServiceListFieldDescription>;

type BaseSynapseServiceCreateOptions = {
  context: TContext;
  name: string;
  description?: string;
  domain?: string;
  unique_id?: string;
  response?: ResponseOptional;
};

type FieldsWithoutTargetOverrides<FIELDS extends FieldList> = {
  [K in keyof FIELDS as K extends TargetOverrideKeys ? never : K]: FIELDS[K];
};

export type SynapseServiceCreateOptions<FIELDS extends FieldList = FieldList> =
  | (BaseSynapseServiceCreateOptions & {
      fields?: FIELDS;
      target?: never;
    })
  | (BaseSynapseServiceCreateOptions & {
      fields?: FieldsWithoutTargetOverrides<FIELDS>;
      target: ServiceListServiceTarget;
    });

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
  type: "synapse/service_call";
};
