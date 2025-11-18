import type {
  ALL_DOMAINS,
  HassThemeMapping,
  PICK_ENTITY,
  PICK_FROM_PLATFORM,
  ServiceListSelector,
  SupportedCountries,
  TAreaId,
  TConfigEntryId,
  TDeviceId,
  TFloorId,
  TLabelId,
  TPlatformId,
} from "@digital-alchemy/hass";

export const inferSymbol = Symbol();
export type inferSymbol = typeof inferSymbol;

/**
 * Extracts a single option value from either a string or an object with a value property.
 */
type ExtractOptionValue<OPTION> = OPTION extends string
  ? OPTION
  : OPTION extends { value: infer VALUE }
    ? VALUE extends string
      ? VALUE
      : never
    : never;

/**
 * Extracts the union of all option values from a select selector's options array.
 * Handles both string options and object options with value property.
 */
type SelectOptionUnion<OPTIONS extends ServiceListSelector["select"]> = OPTIONS extends {
  options: infer OPTION_ARRAY;
}
  ? OPTION_ARRAY extends readonly (infer OPTION)[]
    ? ExtractOptionValue<OPTION>
    : never
  : never;

/**
 * Extracts the domain union type from a single domain or array of domains.
 * Used to properly type PICK_FROM_PLATFORM when domain is provided.
 */
type ExtractDomainUnion<DOMAIN> = DOMAIN extends readonly (infer D)[]
  ? D extends ALL_DOMAINS
    ? D
    : ALL_DOMAINS
  : DOMAIN extends ALL_DOMAINS
    ? DOMAIN
    : ALL_DOMAINS;

/**
 * Common metadata properties for all field descriptions.
 */
type FieldMetadata<BRANDED> = {
  default?: BRANDED;
  description?: string;
  required?: boolean;
};

/**
 * Creates a field description object with selector, optional metadata, and branded type.
 */
type FieldDescription<
  TYPE extends keyof ServiceListSelector,
  OPTIONS extends ServiceListSelector[TYPE],
  BRANDED,
> = {
  [inferSymbol]: BRANDED;
  default?: BRANDED;
  description?: string;
  required?: boolean;
  selector: {
    [K in TYPE]: {
      [P in K]: OPTIONS;
    } & {
      [P in Exclude<keyof ServiceListSelector, K>]?: never;
    };
  }[TYPE];
};

/**
 * Factory function to create field descriptions with proper typing.
 * Overload for null selectors.
 */
function createField<TYPE extends keyof ServiceListSelector, OPTIONS extends null, BRANDED>(
  type: TYPE,
  options: FieldMetadata<BRANDED>,
  branded: BRANDED,
): FieldDescription<TYPE, OPTIONS, BRANDED>;
/**
 * Factory function to create field descriptions with proper typing.
 * Overload for non-null selectors.
 */
function createField<
  TYPE extends keyof ServiceListSelector,
  OPTIONS extends ServiceListSelector[TYPE],
  BRANDED,
>(
  type: TYPE,
  options: OPTIONS & FieldMetadata<BRANDED>,
  branded: BRANDED,
): FieldDescription<TYPE, OPTIONS, BRANDED>;
function createField<
  TYPE extends keyof ServiceListSelector,
  OPTIONS extends ServiceListSelector[TYPE],
  BRANDED,
>(
  type: TYPE,
  options: FieldMetadata<BRANDED> | (OPTIONS & FieldMetadata<BRANDED>),
  branded: BRANDED,
): FieldDescription<TYPE, OPTIONS, BRANDED> {
  const {
    default: default_value,
    description,
    required,
    ...selectorOptions
  } = options as FieldMetadata<BRANDED> | (OPTIONS & FieldMetadata<BRANDED>);
  const hasSelectorOptions = Object.keys(selectorOptions).length > 0;
  const selectorValue = hasSelectorOptions ? (selectorOptions as OPTIONS) : (null as OPTIONS);
  return {
    default: default_value,
    description,
    [inferSymbol]: branded,
    required,
    selector: {
      [type]: selectorValue,
    } as {
      [K in TYPE]: {
        [P in K]: OPTIONS;
      } & {
        [P in Exclude<keyof ServiceListSelector, K>]?: never;
      };
    }[TYPE],
  } as FieldDescription<TYPE, OPTIONS, BRANDED>;
}

// Overloaded functions for selectors with multiple option
// #MARK: Area
function Area(
  options: ServiceListSelector["area"] & { multiple?: false } & FieldMetadata<TAreaId>,
): FieldDescription<"area", ServiceListSelector["area"] & { multiple?: false }, TAreaId>;
function Area(
  options: ServiceListSelector["area"] & { multiple: true } & FieldMetadata<TAreaId[]>,
): FieldDescription<"area", ServiceListSelector["area"] & { multiple: true }, TAreaId[]>;
function Area(
  options: ServiceListSelector["area"] & FieldMetadata<TAreaId | TAreaId[]>,
): FieldDescription<"area", ServiceListSelector["area"], TAreaId | TAreaId[]> {
  const branded = (options.multiple ? [] : undefined) as TAreaId | TAreaId[];
  return createField("area", options, branded);
}

// #MARK: Device
function Device(
  options: ServiceListSelector["device"] & { multiple?: false } & FieldMetadata<TDeviceId>,
): FieldDescription<"device", ServiceListSelector["device"] & { multiple?: false }, TDeviceId>;
function Device(
  options: ServiceListSelector["device"] & { multiple: true } & FieldMetadata<TDeviceId[]>,
): FieldDescription<"device", ServiceListSelector["device"] & { multiple: true }, TDeviceId[]>;
function Device(
  options: ServiceListSelector["device"] & FieldMetadata<TDeviceId | TDeviceId[]>,
): FieldDescription<"device", ServiceListSelector["device"], TDeviceId | TDeviceId[]> {
  const branded = (options.multiple ? [] : undefined) as TDeviceId | TDeviceId[];
  return createField("device", options, branded);
}

// #MARK: Entity
// Overloads with integration parameter (uses PICK_FROM_PLATFORM)
function Entity<
  INTEGRATION extends TPlatformId,
  DOMAIN extends ALL_DOMAINS | ALL_DOMAINS[] = ALL_DOMAINS,
>(
  options: ServiceListSelector["entity"] & {
    multiple?: false;
    domain?: DOMAIN;
    integration: INTEGRATION;
  } & FieldMetadata<PICK_FROM_PLATFORM<INTEGRATION, ExtractDomainUnion<DOMAIN>>>,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple?: false; domain?: DOMAIN; integration: INTEGRATION },
  PICK_FROM_PLATFORM<INTEGRATION, ExtractDomainUnion<DOMAIN>>
>;
function Entity<
  INTEGRATION extends TPlatformId,
  DOMAIN extends ALL_DOMAINS | ALL_DOMAINS[] = ALL_DOMAINS,
>(
  options: ServiceListSelector["entity"] & {
    multiple: true;
    domain?: DOMAIN;
    integration: INTEGRATION;
  } & FieldMetadata<PICK_FROM_PLATFORM<INTEGRATION, ExtractDomainUnion<DOMAIN>>[]>,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple: true; domain?: DOMAIN; integration: INTEGRATION },
  PICK_FROM_PLATFORM<INTEGRATION, ExtractDomainUnion<DOMAIN>>[]
>;
function Entity<INTEGRATION extends TPlatformId>(
  options: ServiceListSelector["entity"] & {
    multiple?: false;
    integration: INTEGRATION;
  } & FieldMetadata<PICK_FROM_PLATFORM<INTEGRATION, ALL_DOMAINS>>,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple?: false; integration: INTEGRATION },
  PICK_FROM_PLATFORM<INTEGRATION, ALL_DOMAINS>
>;
function Entity<INTEGRATION extends TPlatformId>(
  options: ServiceListSelector["entity"] & {
    multiple: true;
    integration: INTEGRATION;
  } & FieldMetadata<PICK_FROM_PLATFORM<INTEGRATION, ALL_DOMAINS>[]>,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple: true; integration: INTEGRATION },
  PICK_FROM_PLATFORM<INTEGRATION, ALL_DOMAINS>[]
>;
// Overloads without integration parameter (uses PICK_ENTITY)
function Entity<DOMAIN extends ALL_DOMAINS = ALL_DOMAINS>(
  options: ServiceListSelector["entity"] & { multiple?: false; domain?: DOMAIN } & FieldMetadata<
      PICK_ENTITY<DOMAIN>
    >,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple?: false; domain?: DOMAIN },
  PICK_ENTITY<DOMAIN>
>;
function Entity<DOMAIN extends ALL_DOMAINS = ALL_DOMAINS>(
  options: ServiceListSelector["entity"] & { multiple: true; domain?: DOMAIN } & FieldMetadata<
      PICK_ENTITY<DOMAIN>[]
    >,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple: true; domain?: DOMAIN },
  PICK_ENTITY<DOMAIN>[]
>;
function Entity(
  options: ServiceListSelector["entity"] & { multiple?: false } & FieldMetadata<PICK_ENTITY>,
): FieldDescription<"entity", ServiceListSelector["entity"] & { multiple?: false }, PICK_ENTITY>;
function Entity(
  options: ServiceListSelector["entity"] & { multiple: true } & FieldMetadata<PICK_ENTITY[]>,
): FieldDescription<"entity", ServiceListSelector["entity"] & { multiple: true }, PICK_ENTITY[]>;
function Entity(
  options:
    | (ServiceListSelector["entity"] & FieldMetadata<PICK_ENTITY | PICK_ENTITY[]>)
    | (ServiceListSelector["entity"] & {
        integration?: TPlatformId;
      } & FieldMetadata<
          | PICK_ENTITY
          | PICK_ENTITY[]
          | PICK_FROM_PLATFORM<TPlatformId, ALL_DOMAINS>
          | PICK_FROM_PLATFORM<TPlatformId, ALL_DOMAINS>[]
        >),
): FieldDescription<"entity", ServiceListSelector["entity"], PICK_ENTITY | PICK_ENTITY[]> {
  const branded = (options.multiple ? [] : undefined) as PICK_ENTITY | PICK_ENTITY[];
  return createField("entity", options, branded);
}

// #MARK: Floor
function Floor(
  options: ServiceListSelector["floor"] & { multiple?: false } & FieldMetadata<TFloorId>,
): FieldDescription<"floor", ServiceListSelector["floor"] & { multiple?: false }, TFloorId>;
function Floor(
  options: ServiceListSelector["floor"] & { multiple: true } & FieldMetadata<TFloorId[]>,
): FieldDescription<"floor", ServiceListSelector["floor"] & { multiple: true }, TFloorId[]>;
function Floor(
  options: ServiceListSelector["floor"] & FieldMetadata<TFloorId | TFloorId[]>,
): FieldDescription<"floor", ServiceListSelector["floor"], TFloorId | TFloorId[]> {
  const branded = (options.multiple ? [] : undefined) as TFloorId | TFloorId[];
  return createField("floor", options, branded);
}

// #MARK: Label
function Label(
  options: ServiceListSelector["label"] & { multiple?: false } & FieldMetadata<TLabelId>,
): FieldDescription<"label", ServiceListSelector["label"] & { multiple?: false }, TLabelId>;
function Label(
  options: ServiceListSelector["label"] & { multiple: true } & FieldMetadata<TLabelId[]>,
): FieldDescription<"label", ServiceListSelector["label"] & { multiple: true }, TLabelId[]>;
function Label(
  options: ServiceListSelector["label"] & FieldMetadata<TLabelId | TLabelId[]>,
): FieldDescription<"label", ServiceListSelector["label"], TLabelId | TLabelId[]> {
  const branded = (options.multiple ? [] : undefined) as TLabelId | TLabelId[];
  return createField("label", options, branded);
}

// #MARK: ObjectSelector
function ObjectSelector(
  options: ServiceListSelector["object"] & { multiple?: false } & FieldMetadata<
      Record<string, unknown>
    >,
): FieldDescription<
  "object",
  ServiceListSelector["object"] & { multiple?: false },
  Record<string, unknown>
>;
function ObjectSelector(
  options: ServiceListSelector["object"] & { multiple: true } & FieldMetadata<
      Record<string, unknown>[]
    >,
): FieldDescription<
  "object",
  ServiceListSelector["object"] & { multiple: true },
  Record<string, unknown>[]
>;
function ObjectSelector(
  options: ServiceListSelector["object"] &
    FieldMetadata<Record<string, unknown> | Record<string, unknown>[]>,
): FieldDescription<
  "object",
  ServiceListSelector["object"],
  Record<string, unknown> | Record<string, unknown>[]
> {
  const branded = (options.multiple ? [] : undefined) as
    | Record<string, unknown>
    | Record<string, unknown>[];
  return createField("object", options, branded);
}

// #MARK: Select
function Select<OPTIONS extends ServiceListSelector["select"]>(
  options: OPTIONS & { multiple?: false } & FieldMetadata<SelectOptionUnion<OPTIONS>>,
): FieldDescription<"select", OPTIONS & { multiple?: false }, SelectOptionUnion<OPTIONS>>;
function Select<OPTIONS extends ServiceListSelector["select"]>(
  options: OPTIONS & { multiple: true } & FieldMetadata<SelectOptionUnion<OPTIONS>[]>,
): FieldDescription<"select", OPTIONS & { multiple: true }, SelectOptionUnion<OPTIONS>[]>;
function Select<OPTIONS extends ServiceListSelector["select"]>(
  options: OPTIONS & FieldMetadata<SelectOptionUnion<OPTIONS> | SelectOptionUnion<OPTIONS>[]>,
): FieldDescription<"select", OPTIONS, SelectOptionUnion<OPTIONS> | SelectOptionUnion<OPTIONS>[]> {
  const branded = (options.multiple ? [] : undefined) as
    | SelectOptionUnion<OPTIONS>
    | SelectOptionUnion<OPTIONS>[];
  return createField("select", options, branded);
}

// #MARK: State
type TState = string | number;
function State(
  options: ServiceListSelector["state"] & { multiple?: false } & FieldMetadata<TState>,
): FieldDescription<"state", ServiceListSelector["state"] & { multiple?: false }, TState>;
function State(
  options: ServiceListSelector["state"] & { multiple: true } & FieldMetadata<TState[]>,
): FieldDescription<"state", ServiceListSelector["state"] & { multiple: true }, TState[]>;
function State(
  options: ServiceListSelector["state"] & FieldMetadata<TState | TState[]>,
): FieldDescription<"state", ServiceListSelector["state"], TState | TState[]> {
  const branded = (options.multiple ? [] : undefined) as TState | TState[];
  return createField("state", options, branded);
}

// #MARK: Statistic
function Statistic(
  options: ServiceListSelector["statistic"] & { multiple?: false } & FieldMetadata<string>,
): FieldDescription<"statistic", ServiceListSelector["statistic"] & { multiple?: false }, string>;
function Statistic(
  options: ServiceListSelector["statistic"] & { multiple: true } & FieldMetadata<string[]>,
): FieldDescription<"statistic", ServiceListSelector["statistic"] & { multiple: true }, string[]>;
function Statistic(
  options: ServiceListSelector["statistic"] & FieldMetadata<string | string[]>,
): FieldDescription<"statistic", ServiceListSelector["statistic"], string | string[]> {
  const branded = (options.multiple ? [] : undefined) as string | string[];
  return createField("statistic", options, branded);
}

// #MARK: Text
function Text(
  options: ServiceListSelector["text"] & { multiple?: false } & FieldMetadata<string>,
): FieldDescription<"text", ServiceListSelector["text"] & { multiple?: false }, string>;
function Text(
  options: ServiceListSelector["text"] & { multiple: true } & FieldMetadata<string[]>,
): FieldDescription<"text", ServiceListSelector["text"] & { multiple: true }, string[]>;
function Text(
  options: ServiceListSelector["text"] & FieldMetadata<string | string[]>,
): FieldDescription<"text", ServiceListSelector["text"], string | string[]> {
  const branded = (options.multiple ? [] : undefined) as string | string[];
  return createField("text", options, branded);
}

export const ServiceField = {
  Action: (options: FieldMetadata<string>) => createField("action", options, undefined as string),

  Addon: (
    options: FieldMetadata<{ name?: string; slug?: string }> & ServiceListSelector["addon"],
  ) => createField("addon", options, undefined as { name?: string; slug?: string }),

  Area,

  AssistPipeline: (options: FieldMetadata<string>) =>
    createField("assist_pipeline", options, undefined as string),

  Attribute: (options: FieldMetadata<Record<string, unknown>> & ServiceListSelector["attribute"]) =>
    createField("attribute", options, undefined as Record<string, unknown>),

  BackupLocation: (options: FieldMetadata<string>) =>
    createField("backup_location", options, undefined as string),

  Boolean: (options: FieldMetadata<boolean>) =>
    createField("boolean", options, undefined as boolean),

  ColorRgb: (options: FieldMetadata<[number, number, number]>) =>
    createField("color_rgb", options, undefined as [number, number, number]),

  ColorTemp: (options: FieldMetadata<number> & ServiceListSelector["color_temp"]) =>
    createField("color_temp", options, undefined as number),

  Condition: (options: FieldMetadata<unknown>) =>
    createField("condition", options, undefined as unknown),

  ConfigEntry: (options: FieldMetadata<TConfigEntryId> & ServiceListSelector["config_entry"]) =>
    createField("config_entry", options, undefined as TConfigEntryId),

  Constant: (options: FieldMetadata<string | number | boolean> & ServiceListSelector["constant"]) =>
    createField("constant", options, undefined as string | number | boolean),

  ConversationAgent: (options: FieldMetadata<string> & ServiceListSelector["conversation_agent"]) =>
    createField("conversation_agent", options, undefined as string),

  Country: (
    options: FieldMetadata<SupportedCountries | SupportedCountries[]> &
      ServiceListSelector["country"],
  ) => createField("country", options, undefined as SupportedCountries | SupportedCountries[]),

  Date: (options: FieldMetadata<string>) => createField("date", options, undefined as string),

  DateTime: (options: FieldMetadata<string>) =>
    createField("datetime", options, undefined as string),

  Device,

  Duration: (options: FieldMetadata<string | number> & ServiceListSelector["duration"]) =>
    createField("duration", options, undefined as string | number),

  Entity,

  File: (options: FieldMetadata<string> & ServiceListSelector["file"]) =>
    createField("file", options, undefined as string),

  Floor,

  Icon: (options: FieldMetadata<string> & ServiceListSelector["icon"]) =>
    createField("icon", options, undefined as string),

  Label,

  Language: (options: FieldMetadata<string> & ServiceListSelector["language"]) =>
    createField("language", options, undefined as string),

  Location: (
    options: FieldMetadata<{ latitude: number; longitude: number; radius?: number }> &
      ServiceListSelector["location"],
  ) =>
    createField(
      "location",
      options,
      undefined as { latitude: number; longitude: number; radius?: number },
    ),

  Media: (options: FieldMetadata<string | string[]> & ServiceListSelector["media"]) =>
    createField("media", options, undefined as string | string[]),

  Number: (options: FieldMetadata<number> & ServiceListSelector["number"]) =>
    createField("number", options, undefined as number),

  Object: ObjectSelector,

  QrCode: (options: FieldMetadata<string> & ServiceListSelector["qr_code"]) =>
    createField("qr_code", options, undefined as string),

  Select,

  State,

  Statistic,

  Target: (options: FieldMetadata<PICK_ENTITY | TDeviceId> & ServiceListSelector["target"]) =>
    createField("target", options, undefined as PICK_ENTITY | TDeviceId),

  Template: (options: FieldMetadata<string>) =>
    createField("template", options, undefined as string),

  Text,

  Theme: (options: FieldMetadata<keyof HassThemeMapping> & ServiceListSelector["theme"]) =>
    createField("theme", options, undefined as keyof HassThemeMapping),

  Time: (options: FieldMetadata<string>) => createField("time", options, undefined as string),

  Trigger: (options: FieldMetadata<unknown>) =>
    createField("trigger", options, undefined as unknown),
};
