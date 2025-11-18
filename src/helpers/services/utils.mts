import type { ALL_DOMAINS, ServiceListSelector } from "@digital-alchemy/hass";

export const inferSymbol = Symbol();
export type inferSymbol = typeof inferSymbol;

/**
 * Extracts a single option value from either a string or an object with a value property.
 */
export type ExtractOptionValue<OPTION> = OPTION extends string
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
export type SelectOptionUnion<OPTIONS extends ServiceListSelector["select"]> = OPTIONS extends {
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
export type ExtractDomainUnion<DOMAIN> = DOMAIN extends readonly (infer D)[]
  ? D extends ALL_DOMAINS
    ? D
    : ALL_DOMAINS
  : DOMAIN extends ALL_DOMAINS
    ? DOMAIN
    : ALL_DOMAINS;

/**
 * Common metadata properties for all field descriptions.
 */
export type FieldMetadata<BRANDED> = {
  default?: BRANDED;
  description?: string;
  required?: boolean;
};

/**
 * Creates a field description object with selector, optional metadata, and branded type.
 */
export type FieldDescription<
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
export function createField<TYPE extends keyof ServiceListSelector, OPTIONS extends null, BRANDED>(
  type: TYPE,
  options: FieldMetadata<BRANDED>,
  branded: BRANDED,
): FieldDescription<TYPE, OPTIONS, BRANDED>;
/**
 * Factory function to create field descriptions with proper typing.
 * Overload for non-null selectors.
 */
export function createField<
  TYPE extends keyof ServiceListSelector,
  OPTIONS extends ServiceListSelector[TYPE],
  BRANDED,
>(
  type: TYPE,
  options: OPTIONS & FieldMetadata<BRANDED>,
  branded: BRANDED,
): FieldDescription<TYPE, OPTIONS, BRANDED>;
export function createField<
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
