import { is, TServiceParams } from "@digital-alchemy/core";
import { and, eq } from "drizzle-orm";
import { drizzle as drizzleMysql, MySql2Database } from "drizzle-orm/mysql2";
import { migrate as migrateMysql } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import { join } from "path";

import { HomeAssistantEntityRow, MIGRATION_PATH, SynapseDatabase } from "../../schema/common.mts";
import { mysqlHomeAssistantEntity, mysqlHomeAssistantEntityLocals } from "../../schema/mysql.mts";

export function DatabaseMySQLService({
  lifecycle,
  config,
  logger,
  hass,
  internal,
}: TServiceParams): SynapseDatabase {
  let mysqlClient: mysql.Connection;
  let database: MySql2Database<Record<string, unknown>>;

  const application_name = internal.boot.application.name;
  const registeredDefaults = new Map<string, object>();

  lifecycle.onPostConfig(async () => {
    // Only connect if this is the configured database type
    if (config.synapse.DATABASE_TYPE !== "mysql") {
      return;
    }

    // Set up shutdown hooks
    lifecycle.onShutdownStart(() => {
      logger.trace("closing mysql database connection");
      void mysqlClient.end();
    });

    // Load library / table refs

    // Establish connection
    logger.trace("initializing mysql database connection");
    mysqlClient = await mysql.createConnection(config.synapse.DATABASE_URL);
    database = drizzleMysql(mysqlClient);

    // Run migrations
    try {
      await migrateMysql(database, { migrationsFolder: join(MIGRATION_PATH, "mysql") });
      logger.trace("mysql database migrations completed");
    } catch (error) {
      logger.warn("migration failed, continuing with existing schema", error);
    }
  });

  // Update entity
  // #MARK: update
  async function update(unique_id: string, content: object, defaults?: object) {
    const entity_id = hass.entity.registry.current.find(i => i.unique_id === unique_id)?.entity_id;
    const state_json = JSON.stringify(content);
    const now = new Date().toISOString();
    defaults ??= registeredDefaults.get(unique_id);

    try {
      await database
        .insert(mysqlHomeAssistantEntity)
        .values({
          app_unique_id: config.synapse.METADATA_UNIQUE_ID,
          application_name: application_name,
          base_state: JSON.stringify(defaults),
          entity_id: entity_id,
          first_observed: new Date(),
          last_modified: now,
          last_reported: now,
          state_json: state_json,
          unique_id: unique_id,
        })
        .onDuplicateKeyUpdate({
          set: {
            app_unique_id: config.synapse.METADATA_UNIQUE_ID,
            application_name: application_name,
            base_state: JSON.stringify(defaults),
            entity_id: entity_id,
            last_modified: now,
            last_reported: now,
            state_json: state_json,
          },
        });

      logger.trace({ unique_id }, "updated entity");
    } catch (error) {
      logger.error({ error, unique_id }, "failed to update entity");
      throw error;
    }
  }

  // Load entity row
  // #MARK: loadRow
  async function loadRow<LOCALS extends object = object>(
    unique_id: string,
  ): Promise<HomeAssistantEntityRow<LOCALS>> {
    logger.trace({ app_unique_id: config.synapse.METADATA_UNIQUE_ID, unique_id }, "loading entity");

    try {
      const rows = await database
        .select()
        .from(mysqlHomeAssistantEntity)
        .where(
          and(
            eq(mysqlHomeAssistantEntity.unique_id, unique_id),
            eq(mysqlHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      if (is.empty(rows)) {
        return undefined;
      }

      const [row] = rows;

      // Normalize data to match common interface
      const normalizedRow: HomeAssistantEntityRow<LOCALS> = {
        app_unique_id: row.app_unique_id,
        application_name: row.application_name,
        base_state:
          typeof row.base_state === "string" ? row.base_state : JSON.stringify(row.base_state),
        entity_id: row.entity_id,
        first_observed:
          row.first_observed instanceof Date
            ? row.first_observed.toISOString()
            : row.first_observed,
        id: row.id,
        last_modified: row.last_modified,
        last_reported: row.last_reported,
        locals: {} as LOCALS,
        state_json:
          typeof row.state_json === "string" ? row.state_json : JSON.stringify(row.state_json),
        unique_id: row.unique_id,
      };

      logger.trace({ entity_id: row.entity_id, unique_id }, "loaded entity");
      return normalizedRow;
    } catch (error) {
      logger.error({ error, unique_id }, "failed to load entity");
      throw error;
    }
  }

  // Load entity with defaults
  // #MARK: load
  async function load<LOCALS extends object = object>(
    unique_id: string,
    defaults: object,
  ): Promise<HomeAssistantEntityRow<LOCALS>> {
    try {
      const data = await loadRow<LOCALS>(unique_id);
      const cleaned = Object.fromEntries(
        Object.entries(defaults).filter(([, value]) => value !== undefined),
      );
      registeredDefaults.set(unique_id, cleaned);

      const current = data ? JSON.parse(data.base_state) : {};
      if (data && JSON.stringify(cleaned) === JSON.stringify(current)) {
        logger.trace({ unique_id }, "equal defaults");
        return data;
      }
      logger.debug(
        { cleaned, current, unique_id },
        "hard config change detected, resetting entity",
      );
    } catch (error) {
      // Check if this is the expected "entity not found" error
      if (error instanceof Error && error.message.includes("Entity not found")) {
        logger.trace({ name: load, unique_id }, `creating new database entry`);
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }

    const cleaned = Object.fromEntries(
      Object.entries(defaults).filter(([, value]) => value !== undefined),
    );
    await update(unique_id, cleaned, cleaned);
    return await loadRow<LOCALS>(unique_id);
  }

  // Update local storage
  // #MARK: updateLocal
  async function updateLocal(unique_id: string, key: string, content: unknown) {
    logger.trace({ key, unique_id }, "updateLocal");

    if (is.undefined(content)) {
      await deleteLocal(unique_id, key);
      return;
    }

    const value_json = JSON.stringify(content);
    const last_modified = new Date();

    try {
      await database
        .insert(mysqlHomeAssistantEntityLocals)
        .values({
          app_unique_id: config.synapse.METADATA_UNIQUE_ID,
          key,
          last_modified: last_modified,
          unique_id: unique_id,
          value_json: value_json,
        })
        .onDuplicateKeyUpdate({
          set: {
            app_unique_id: config.synapse.METADATA_UNIQUE_ID,
            last_modified: last_modified,
            value_json: value_json,
          },
        });

      logger.trace({ key, unique_id }, "updated local");
    } catch (error) {
      logger.error({ error, key, unique_id }, "failed to update local");
      throw error;
    }
  }

  // Load locals
  // #MARK: loadLocals
  async function loadLocals(unique_id: string) {
    logger.trace({ unique_id }, "initial load of locals");

    try {
      const locals = await database
        .select()
        .from(mysqlHomeAssistantEntityLocals)
        .where(
          and(
            eq(mysqlHomeAssistantEntityLocals.unique_id, unique_id),
            eq(mysqlHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      return new Map<string, unknown>(locals.map(i => [i.key, JSON.parse(i.value_json)]));
    } catch (error) {
      logger.error({ error, unique_id }, "failed to load locals");
      throw error;
    }
  }

  // Delete local
  // #MARK: deleteLocal
  async function deleteLocal(unique_id: string, key: string) {
    logger.debug({ key, unique_id }, `delete local (value undefined)`);

    try {
      await database
        .delete(mysqlHomeAssistantEntityLocals)
        .where(
          and(
            eq(mysqlHomeAssistantEntityLocals.unique_id, unique_id),
            eq(mysqlHomeAssistantEntityLocals.key, key),
            eq(mysqlHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );
    } catch (error) {
      logger.error({ error, key, unique_id }, "failed to delete local");
      throw error;
    }
  }

  // Delete all locals for unique_id
  // #MARK: deleteLocalsByUniqueId
  async function deleteLocalsByUniqueId(unique_id: string) {
    logger.debug({ unique_id }, "delete all locals");

    try {
      await database
        .delete(mysqlHomeAssistantEntityLocals)
        .where(
          and(
            eq(mysqlHomeAssistantEntityLocals.unique_id, unique_id),
            eq(mysqlHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );
    } catch (error) {
      logger.error({ error, unique_id }, "failed to delete locals");
      throw error;
    }
  }

  // Delete entity
  // #MARK: deleteEntity
  async function deleteEntity(unique_id: string) {
    logger.debug({ unique_id }, "delete entity");

    try {
      await database
        .delete(mysqlHomeAssistantEntity)
        .where(
          and(
            eq(mysqlHomeAssistantEntity.unique_id, unique_id),
            eq(mysqlHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      logger.trace({ unique_id }, "success");
    } catch (error) {
      logger.error({ error, unique_id }, "failed to delete entity");
      throw error;
    }
  }

  return {
    deleteEntity,
    deleteLocal,
    deleteLocalsByUniqueId,
    getDatabase: () => database,
    load,
    loadLocals,
    update,
    updateLocal,
  };
}
