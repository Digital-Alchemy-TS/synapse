import type {
  ALL_DOMAINS,
  PICK_ENTITY,
  PICK_FROM_PLATFORM,
  ServiceListSelector,
  TPlatformId,
} from "@digital-alchemy/hass";

import type { ExtractDomainUnion, FieldDescription, FieldMetadata } from "./utils.mts";
import { createField } from "./utils.mts";

export function Entity<
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
export function Entity<
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
export function Entity<INTEGRATION extends TPlatformId>(
  options: ServiceListSelector["entity"] & {
    multiple?: false;
    integration: INTEGRATION;
  } & FieldMetadata<PICK_FROM_PLATFORM<INTEGRATION, ALL_DOMAINS>>,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple?: false; integration: INTEGRATION },
  PICK_FROM_PLATFORM<INTEGRATION, ALL_DOMAINS>
>;
export function Entity<INTEGRATION extends TPlatformId>(
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
export function Entity<DOMAIN extends ALL_DOMAINS = ALL_DOMAINS>(
  options: ServiceListSelector["entity"] & { multiple?: false; domain?: DOMAIN } & FieldMetadata<
      PICK_ENTITY<DOMAIN>
    >,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple?: false; domain?: DOMAIN },
  PICK_ENTITY<DOMAIN>
>;
export function Entity<DOMAIN extends ALL_DOMAINS = ALL_DOMAINS>(
  options: ServiceListSelector["entity"] & { multiple: true; domain?: DOMAIN } & FieldMetadata<
      PICK_ENTITY<DOMAIN>[]
    >,
): FieldDescription<
  "entity",
  ServiceListSelector["entity"] & { multiple: true; domain?: DOMAIN },
  PICK_ENTITY<DOMAIN>[]
>;
export function Entity(
  options: ServiceListSelector["entity"] & { multiple?: false } & FieldMetadata<PICK_ENTITY>,
): FieldDescription<"entity", ServiceListSelector["entity"] & { multiple?: false }, PICK_ENTITY>;
export function Entity(
  options: ServiceListSelector["entity"] & { multiple: true } & FieldMetadata<PICK_ENTITY[]>,
): FieldDescription<"entity", ServiceListSelector["entity"] & { multiple: true }, PICK_ENTITY[]>;
export function Entity(
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
