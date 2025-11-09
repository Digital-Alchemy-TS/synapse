import type { TServiceParams } from "@digital-alchemy/core";

import type { SynapseDatabase } from "../../schema/common.mts";

export async function DatabaseService({
  config,
  hass,
  synapse,
  logger,
}: TServiceParams): Promise<SynapseDatabase> {
  const ADAPTERS = {
    mysql: synapse.db_mysql,
    postgresql: synapse.db_postgres,
    sqlite: synapse.db_sqlite,
  };
  const db = () => ADAPTERS[config.synapse.DATABASE_TYPE] || synapse.db_sqlite;

  return {
    deleteEntity: async (unique_id: string) => await db().deleteEntity(unique_id),
    deleteLocal: async (unique_id: string, key: string) => await db().deleteLocal(unique_id, key),
    deleteLocalsByUniqueId: async (unique_id: string) =>
      await db().deleteLocalsByUniqueId(unique_id),
    getDatabase: () => db().getDatabase(),
    load: async <LOCALS extends object = object>(unique_id: string, defaults: object) =>
      await db().load<LOCALS>(unique_id, defaults),
    loadLocals: async (unique_id: string) => await db().loadLocals(unique_id),
    update: async (unique_id: string, content: object, defaults?: object) => {
      const entity_id = hass.entity.registry.current.find(
        i => i.unique_id === unique_id,
      )?.entity_id;
      if (!entity_id) {
        if (synapse.configure.isRegistered()) {
          logger.warn(
            { name: "update", unique_id },
            `app registered, but entity does not exist (reload?)`,
          );
          return;
        }
        logger.debug({ content, defaults, unique_id }, "app not registered, skipping write");
        return;
      }
      await db().update(unique_id, content, defaults);
    },
    updateLocal: async (unique_id: string, key: string, content: unknown) =>
      await db().updateLocal(unique_id, key, content),
  };
}
