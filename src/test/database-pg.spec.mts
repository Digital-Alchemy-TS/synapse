import { EntityRegistryItem, HassEntitySetupMapping } from "@digital-alchemy/hass";
import { and, eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 } from "uuid";

import { synapseTestRunner } from "../mock/mock-synapse.module.mts";
import { pgHomeAssistantEntity } from "../schema/pg.mts";

afterEach(async () => {
  await synapseTestRunner.teardown();
  vi.restoreAllMocks();
});

const testRunner = () =>
  synapseTestRunner.bootLibrariesFirst().configure({
    synapse: {
      DATABASE_TYPE: "postgresql",
      DATABASE_URL:
        process.env.DB_PG || "postgresql://synapse_user:synapse_password@localhost:5432/synapse",
    },
  });

it("exists", async () => {
  expect.assertions(1);
  await testRunner().run(({ synapse }) => {
    expect(synapse.db_postgres).toBeDefined();
  });
});

describe("update", () => {
  it("should insert new entity when it doesn't exist", async () => {
    expect.assertions(6);
    const unique_id = "test-entity-123";
    const content = { status: "active", value: 42 };
    const defaults = { status: "inactive", value: 0 };

    await testRunner().run(async ({ synapse, config, internal }) => {
      // Call update function
      await synapse.db_postgres.update(unique_id, content, defaults);

      // Query database directly to verify insertion
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.unique_id).toBe(unique_id);
      expect(row.state_json).toEqual(content);
      expect(row.base_state).toBe(JSON.stringify(defaults));
      expect(row.application_name).toBe(internal.boot.application.name);
      expect(row.app_unique_id).toBe(config.synapse.METADATA_UNIQUE_ID);
    });
  });

  it("should update existing entity when it already exists", async () => {
    expect.assertions(3);
    const unique_id = "test-entity-update";
    const initialContent = { status: "initial", value: 10 };
    const updatedContent = { status: "updated", value: 20 };
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse, config }) => {
      // Insert initial entity
      await synapse.db_postgres.update(unique_id, initialContent, defaults);

      // Update the entity
      await synapse.db_postgres.update(unique_id, updatedContent, defaults);

      // Query database to verify update
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.state_json).toEqual(updatedContent);
      expect(row.base_state).toBe(JSON.stringify(defaults));
    });
  });

  it("should handle onConflictDoUpdate correctly", async () => {
    expect.assertions(3);
    const unique_id = "test-entity-conflict";
    const content1 = { status: "first", value: 100 };
    const content2 = { status: "second", value: 200 };
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse, config }) => {
      // First insert
      await synapse.db_postgres.update(unique_id, content1, defaults);

      // Second insert with same unique_id (should trigger conflict resolution)
      await synapse.db_postgres.update(unique_id, content2, defaults);

      // Query database to verify only one row exists and it's updated
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.state_json).toEqual(content2);
      expect(row.base_state).toBe(JSON.stringify(defaults));
    });
  });

  it("should set timestamps correctly", async () => {
    expect.assertions(3);
    const unique_id = "test-entity-timestamps";
    const content = { status: "active" };
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse, config }) => {
      const beforeUpdate = new Date();
      await synapse.db_postgres.update(unique_id, content, defaults);
      const afterUpdate = new Date();

      // Query database to verify timestamps
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      const row = rows[0];
      const lastModified = new Date(row.last_modified);
      const firstObserved = new Date(row.first_observed);

      expect(lastModified.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(lastModified.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
      expect(firstObserved.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  it("should handle entity_id lookup from hass entity registry", async () => {
    expect.assertions(1);
    const unique_id = "test-entity-registry";
    const content = { status: "active" };
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse, config, hass }) => {
      // Mock entity registry to return a specific entity_id
      const mockEntityId = "sensor.test_entity" as keyof HassEntitySetupMapping;
      hass.entity.registry.current = [
        {
          categories: {},
          entity_id: mockEntityId,
          has_entity_name: false,
          id: "test-id",
          labels: [],
          name: "Test Entity",
          platform: "synapse",
          supported_features: 0,
          unique_id,
        } as unknown as EntityRegistryItem<keyof HassEntitySetupMapping>,
      ];

      await synapse.db_postgres.update(unique_id, content, defaults);

      // Query database to verify entity_id was set correctly
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows[0].entity_id).toBe(mockEntityId);
    });
  });

  it("should handle undefined entity_id when entity not found in registry", async () => {
    expect.assertions(1);
    const unique_id = "test-entity-no-registry";
    const content = { status: "active" };
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse, config, hass }) => {
      // Mock empty entity registry
      hass.entity.registry.current = [];

      await synapse.db_postgres.update(unique_id, content, defaults);

      // Query database to verify entity_id is null
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows[0].entity_id).toBeNull();
    });
  });

  it("should handle errors and re-throw them", async () => {
    expect.assertions(1);
    const unique_id = "test-entity-error";
    const content = { status: "active" };
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse }) => {
      // Mock the database to throw an error
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;

      // Mock insert to throw an error
      vi.spyOn(database, "insert").mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      // Expect the update to throw an error
      await expect(synapse.db_postgres.update(unique_id, content, defaults)).rejects.toThrow(
        "Database connection failed",
      );

      // Restore the original insert method
      vi.restoreAllMocks();
    });
  });
});

describe("load", () => {
  it("should create new entity when no rows are found during load", async () => {
    expect.assertions(3);
    const unique_id = v4();
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse }) => {
      // Try to load an entity that doesn't exist
      const result = await synapse.db_postgres.load(unique_id, defaults);

      // Should return the newly created entity since load creates one when not found
      expect(result).toBeDefined();
      expect(result?.unique_id).toBe(unique_id);
      expect(result?.base_state).toBe(JSON.stringify(defaults));
    });
  });

  it("should use registered defaults when defaults parameter is not provided", async () => {
    expect.assertions(1);
    const unique_id = "test-entity-defaults";
    const content = { status: "active" };
    const registeredDefaults = { status: "registered", value: 999 };

    await testRunner().run(async ({ synapse, config }) => {
      // First call load to register the defaults
      await synapse.db_postgres.load(unique_id, registeredDefaults);

      // Second call without defaults (should use registered defaults)
      await synapse.db_postgres.update(unique_id, content);

      // Query database to verify registered defaults were used
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows[0].base_state).toBe(JSON.stringify(registeredDefaults));
    });
  });

  it("should re-throw unexpected errors", async () => {
    expect.assertions(1);
    const unique_id = v4();
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse }) => {
      // Mock the database to throw an unexpected error
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;

      // Mock select to throw an unexpected error
      vi.spyOn(database, "select").mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      // Should re-throw unexpected errors
      await expect(synapse.db_postgres.load(unique_id, defaults)).rejects.toThrow(
        "Database connection failed",
      );

      // Restore the original select method
      vi.restoreAllMocks();
    });
  });
});
