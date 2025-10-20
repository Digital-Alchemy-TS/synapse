export type CleanupModes = "abandon" | "delete";

export type AbandonedEntityResponse = {
  success: boolean;
  abandoned_entities: Record<string, unknown>[];
  total_abandoned: number;
  total_registry_entities: number;
  current_configuration_entities: number;
  app_unique_id: string;
  cleanup_mode: CleanupModes;
};
