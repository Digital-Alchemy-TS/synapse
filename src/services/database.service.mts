import { TServiceParams } from "@digital-alchemy/core";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import {
  homeAssistantEntity,
  homeAssistantEntityLocals,
  HomeAssistantEntityRow,
  SynapseDatabase,
} from "../schema/tables.mts";

export async function DatabaseService({
  lifecycle,
  config,
  logger,
  hass,
  internal,
  synapse,
}: TServiceParams): Promise<SynapseDatabase> {
  let database: ReturnType<typeof drizzle>;
  let sqlite: Database.Database;

  const application_name = internal.boot.application.name;
  const registeredDefaults = new Map<string, object>();

  lifecycle.onPostConfig(async () => {
    logger.trace("initializing database connection");

    if (config.synapse.DATABASE_TYPE === "sqlite") {
      // Extract file path from URL
      const filePath = config.synapse.DATABASE_URL.replace("file:", "");
      sqlite = new Database(filePath);
      database = drizzle(sqlite);

      // Run migrations
      try {
        await migrate(database, { migrationsFolder: "./src/schema/migrations" });
        logger.trace("database migrations completed");
      } catch (error) {
        logger.warn("migration failed, continuing with existing schema", error);
      }
    } else {
      throw new Error(`Database type ${config.synapse.DATABASE_TYPE} not yet implemented`);
    }
  });

  lifecycle.onShutdownStart(() => {
    logger.trace("closing database connection");
    if (sqlite) {
      sqlite.close();
    }
  });

  // Update entity
  async function update(unique_id: string, content: object, defaults?: object) {
    const entity_id = hass.entity.registry.current.find(i => i.unique_id === unique_id)?.entity_id;
    if (!entity_id) {
      if (synapse.configure.isRegistered()) {
        logger.warn(
          { name: update, unique_id },
          `app registered, but entity does not exist (reload?)`,
        );
        return;
      }
      logger.warn("app not registered, skipping write");
      return;
    }

    const state_json = JSON.stringify(content);
    const now = new Date().toISOString();
    defaults ??= registeredDefaults.get(unique_id);

    try {
      await database
        .insert(homeAssistantEntity)
        .values({
          application_name: application_name,
          base_state: JSON.stringify(defaults),
          entity_id: entity_id,
          first_observed: now,
          last_modified: now,
          last_reported: now,
          state_json: state_json,
          unique_id: unique_id,
        })
        .onConflictDoUpdate({
          set: {
            application_name: application_name,
            base_state: JSON.stringify(defaults),
            entity_id: entity_id,
            last_modified: now,
            last_reported: now,
            state_json: state_json,
          },
          target: homeAssistantEntity.unique_id,
        });

      logger.trace({ unique_id }, "updated entity");
    } catch (error) {
      logger.error({ error, unique_id }, "failed to update entity");
      throw error;
    }
  }

  // Load entity row
  async function loadRow<LOCALS extends object = object>(
    unique_id: string,
  ): Promise<HomeAssistantEntityRow<LOCALS> | undefined> {
    logger.trace({ unique_id }, "loading entity");

    try {
      const row = await database
        .select()
        .from(homeAssistantEntity)
        .where(
          and(
            eq(homeAssistantEntity.unique_id, unique_id),
            eq(homeAssistantEntity.application_name, application_name),
          ),
        )
        .get();

      if (!row) {
        logger.debug("entity not found in database");
        return undefined;
      }

      logger.trace({ entity_id: row.entity_id, unique_id }, "loaded entity");
      return { ...row, locals: {} as LOCALS };
    } catch (error) {
      logger.error({ error, unique_id }, "failed to load entity");
      throw error;
    }
  }

  // Load entity with defaults
  async function load<LOCALS extends object = object>(
    unique_id: string,
    defaults: object,
  ): Promise<HomeAssistantEntityRow<LOCALS> | undefined> {
    const data = await loadRow(unique_id);
    const cleaned = Object.fromEntries(
      Object.entries(defaults).filter(([, value]) => value !== undefined),
    );
    registeredDefaults.set(unique_id, cleaned);

    if (data) {
      const current = JSON.parse(data.base_state);
      if (JSON.stringify(cleaned) === JSON.stringify(current)) {
        logger.trace({ unique_id }, "equal defaults");
        return { ...data, locals: {} as LOCALS };
      }
      logger.debug(
        { cleaned, current, unique_id },
        "hard config change detected, resetting entity",
      );
    }

    logger.trace({ name: load, unique_id }, `creating new database entry`);
    await update(unique_id, cleaned, cleaned);
    const newData = await loadRow(unique_id);
    return newData ? { ...newData, locals: {} as LOCALS } : undefined;
  }

  // Update local storage
  async function updateLocal(unique_id: string, key: string, content: unknown) {
    logger.trace({ key, unique_id }, "updateLocal");

    if (content === undefined) {
      await deleteLocal(unique_id, key);
      return;
    }

    const value_json = JSON.stringify(content);
    const last_modified = new Date().toISOString();

    try {
      await database
        .insert(homeAssistantEntityLocals)
        .values({
          // Handle string unique_id
          key,
          last_modified: last_modified,
          unique_id: parseInt(unique_id) || 0,
          value_json: value_json,
        })
        .onConflictDoUpdate({
          set: {
            last_modified: last_modified,
            value_json: value_json,
          },
          target: [homeAssistantEntityLocals.unique_id, homeAssistantEntityLocals.key],
        });

      logger.trace({ key, unique_id }, "updated local");
    } catch (error) {
      logger.error({ error, key, unique_id }, "failed to update local");
      throw error;
    }
  }

  // Load locals
  async function loadLocals(unique_id: string) {
    if (!internal.boot.completedLifecycleEvents.has("PostConfig")) {
      logger.warn("cannot load locals before [PostConfig]");
      return undefined;
    }

    logger.trace({ unique_id }, "initial load of locals");

    try {
      const locals = await database
        .select()
        .from(homeAssistantEntityLocals)
        .where(eq(homeAssistantEntityLocals.unique_id, parseInt(unique_id) || 0));

      return new Map<string, unknown>(locals.map(i => [i.key, JSON.parse(i.value_json)]));
    } catch (error) {
      logger.error({ error, unique_id }, "failed to load locals");
      throw error;
    }
  }

  // Delete local
  async function deleteLocal(unique_id: string, key: string) {
    logger.debug({ key, unique_id }, `delete local (value undefined)`);

    try {
      await database
        .delete(homeAssistantEntityLocals)
        .where(
          and(
            eq(homeAssistantEntityLocals.unique_id, parseInt(unique_id) || 0),
            eq(homeAssistantEntityLocals.key, key),
          ),
        );
    } catch (error) {
      logger.error({ error, key, unique_id }, "failed to delete local");
      throw error;
    }
  }

  // Delete all locals for unique_id
  async function deleteLocalsByUniqueId(unique_id: string) {
    logger.debug({ unique_id }, "delete all locals");

    try {
      await database
        .delete(homeAssistantEntityLocals)
        .where(eq(homeAssistantEntityLocals.unique_id, parseInt(unique_id) || 0));
    } catch (error) {
      logger.error({ error, unique_id }, "failed to delete locals");
      throw error;
    }
  }

  return {
    deleteLocal,
    deleteLocalsByUniqueId,
    getDatabase: () => database,
    load,
    loadLocals,
    update,
    updateLocal,
  };
}
