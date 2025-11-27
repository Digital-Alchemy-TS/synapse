import type {
  HassThemeMapping,
  PICK_ENTITY,
  ServiceListSelector,
  SupportedCountries,
  TAreaId,
  TConfigEntryId,
  TDeviceId,
  TFloorId,
  TLabelId,
} from "@digital-alchemy/hass";

import { Entity } from "./selector-entity.mts";
import type { FieldDescription, FieldMetadata, SelectOptionUnion } from "./utils.mts";
import { createField } from "./utils.mts";

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
// Overloads with integration parameter (uses PICK_FROM_PLATFORM)

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

// #MARK: ServiceField
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
