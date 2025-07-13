import { TServiceParams } from "@digital-alchemy/core";
import Database from "better-sqlite3";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import { migrate as migrateMysql } from "drizzle-orm/mysql2/migrator";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import mysql from "mysql2/promise";
import postgres from "postgres";

// Import the default SQLite schema for types
import { HomeAssistantEntityRow, SynapseDatabase } from "../schema/tables.mts";

// Dynamic schema imports based on database type
async function getSchema(databaseType: string) {
  switch (databaseType) {
    case "postgresql":
      return await import("../schema/tables.postgresql.mts");
    case "mysql":
      return await import("../schema/tables.mysql.mts");
    case "sqlite":
    default:
      return await import("../schema/tables.mts");
  }
}

export async function DatabaseService({
  lifecycle,
  config,
  logger,
  hass,
  internal,
  synapse,
}: TServiceParams): Promise<SynapseDatabase> {
  let database:
    | ReturnType<typeof drizzle>
    | ReturnType<typeof drizzlePostgres>
    | ReturnType<typeof drizzleMysql>;
  let sqlite: Database.Database | undefined;
  let postgresClient: postgres.Sql | undefined;
  let mysqlClient: mysql.Connection | undefined;

  const application_name = internal.boot.application.name;
  const app_unique_id = config.synapse.METADATA_UNIQUE_ID;
  const registeredDefaults = new Map<string, object>();

  // Get the appropriate schema based on database type
  const schema = await getSchema(config.synapse.DATABASE_TYPE);
  const { homeAssistantEntity, homeAssistantEntityLocals } = schema;

  lifecycle.onPostConfig(async () => {
    logger.trace("initializing database connection");

    if (config.synapse.DATABASE_TYPE === "sqlite") {
      // SQLite connection
      const filePath = config.synapse.DATABASE_URL.replace("file:", "");
      sqlite = new Database(filePath);
      database = drizzle(sqlite);

      // Run migrations
      try {
        await migrate(database, { migrationsFolder: "./src/schema/migrations/sqlite" });
        logger.trace("database migrations completed");
      } catch (error) {
        logger.warn("migration failed, continuing with existing schema", error);
      }
    } else if (config.synapse.DATABASE_TYPE === "postgresql") {
      // PostgreSQL connection
      postgresClient = postgres(config.synapse.DATABASE_URL);
      database = drizzlePostgres(postgresClient);

      // Run migrations
      try {
        await migratePostgres(database, { migrationsFolder: "./src/schema/migrations/postgresql" });
        logger.trace("database migrations completed");
      } catch (error) {
        logger.warn("migration failed, continuing with existing schema", error);
      }
    } else if (config.synapse.DATABASE_TYPE === "mysql") {
      // MySQL connection
      mysqlClient = await mysql.createConnection(config.synapse.DATABASE_URL);
      database = drizzleMysql(mysqlClient);

      // Run migrations
      try {
        await migrateMysql(database, { migrationsFolder: "./src/schema/migrations/mysql" });
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
    if (postgresClient) {
      void postgresClient.end();
    }
    if (mysqlClient) {
      void mysqlClient.end();
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
      await (database as any)
        .insert(homeAssistantEntity)
        .values({
          app_unique_id: app_unique_id,
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
            app_unique_id: app_unique_id,
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
      const row = await (database as any)
        .select()
        .from(homeAssistantEntity)
        .where(
          and(
            eq(homeAssistantEntity.unique_id, unique_id),
            eq(homeAssistantEntity.app_unique_id, app_unique_id),
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
      await (database as any)
        .insert(homeAssistantEntityLocals)
        .values({
          app_unique_id: app_unique_id,
          // Handle string unique_id
          key,
          last_modified: last_modified,
          unique_id: parseInt(unique_id) || 0,
          value_json: value_json,
        })
        .onConflictDoUpdate({
          set: {
            app_unique_id: app_unique_id,
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
      const locals = await (database as any)
        .select()
        .from(homeAssistantEntityLocals)
        .where(
          and(
            eq(homeAssistantEntityLocals.unique_id, parseInt(unique_id) || 0),
            eq(homeAssistantEntityLocals.app_unique_id, app_unique_id),
          ),
        );

      return new Map<string, unknown>(
        locals.map((i: { key: string; value_json: string }) => [i.key, JSON.parse(i.value_json)]),
      );
    } catch (error) {
      logger.error({ error, unique_id }, "failed to load locals");
      throw error;
    }
  }

  // Delete local
  async function deleteLocal(unique_id: string, key: string) {
    logger.debug({ key, unique_id }, `delete local (value undefined)`);

    try {
      await (database as any)
        .delete(homeAssistantEntityLocals)
        .where(
          and(
            eq(homeAssistantEntityLocals.unique_id, parseInt(unique_id) || 0),
            eq(homeAssistantEntityLocals.key, key),
            eq(homeAssistantEntityLocals.app_unique_id, app_unique_id),
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
      await (database as any)
        .delete(homeAssistantEntityLocals)
        .where(
          and(
            eq(homeAssistantEntityLocals.unique_id, parseInt(unique_id) || 0),
            eq(homeAssistantEntityLocals.app_unique_id, app_unique_id),
          ),
        );
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
