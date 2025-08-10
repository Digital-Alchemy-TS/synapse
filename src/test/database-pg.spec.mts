import { EntityRegistryItem, HassEntitySetupMapping } from "@digital-alchemy/hass";
import { and, eq } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { v4 } from "uuid";

import { synapseTestRunner } from "../mock/mock-synapse.module.mts";
import { pgHomeAssistantEntity } from "../schema/pg.mts";
import { pgHomeAssistantEntityLocals } from "../schema/pg.mts";

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
    const unique_id = v4();
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
    const unique_id = v4();
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
    const unique_id = v4();
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
    const unique_id = v4();
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
    const unique_id = v4();
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
    const unique_id = v4();
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
    const unique_id = v4();
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
    const unique_id = v4();
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

describe("locals", () => {
  it("should insert new local when it doesn't exist", async () => {
    expect.assertions(4);
    const unique_id = v4();
    const key = "test-key";
    const content = { status: "active", value: 42 };

    await testRunner().run(async ({ synapse, config }) => {
      // Call updateLocal function
      await synapse.db_postgres.updateLocal(unique_id, key, content);

      // Query database directly to verify insertion
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntityLocals)
        .where(
          and(
            eq(pgHomeAssistantEntityLocals.unique_id, unique_id),
            eq(pgHomeAssistantEntityLocals.key, key),
            eq(pgHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(1);
      const row = rows[0];
      expect(row.unique_id).toBe(unique_id);
      expect(row.key).toBe(key);
      expect(row.value_json).toEqual(content);
    });
  });

  it("should update existing local when it already exists", async () => {
    expect.assertions(2);
    const unique_id = v4();
    const key = "test-key";
    const initialContent = { status: "initial", value: 10 };
    const updatedContent = { status: "updated", value: 20 };

    await testRunner().run(async ({ synapse, config }) => {
      // Insert initial local
      await synapse.db_postgres.updateLocal(unique_id, key, initialContent);

      // Update the local
      await synapse.db_postgres.updateLocal(unique_id, key, updatedContent);

      // Query database to verify update
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntityLocals)
        .where(
          and(
            eq(pgHomeAssistantEntityLocals.unique_id, unique_id),
            eq(pgHomeAssistantEntityLocals.key, key),
            eq(pgHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(1);
      expect(rows[0].value_json).toEqual(updatedContent);
    });
  });

  it("should delete local when content is undefined", async () => {
    expect.assertions(1);
    const unique_id = v4();
    const key = "test-key";
    const content = { status: "active" };

    await testRunner().run(async ({ synapse, config }) => {
      // Insert a local first
      await synapse.db_postgres.updateLocal(unique_id, key, content);

      // Delete it by setting content to undefined
      await synapse.db_postgres.updateLocal(unique_id, key, undefined);

      // Query database to verify deletion
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntityLocals)
        .where(
          and(
            eq(pgHomeAssistantEntityLocals.unique_id, unique_id),
            eq(pgHomeAssistantEntityLocals.key, key),
            eq(pgHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(0);
    });
  });

  it("should load all locals for a unique_id", async () => {
    expect.assertions(3);
    const unique_id = v4();
    const locals = [
      { content: { value: 1 }, key: "key1" },
      { content: { value: 2 }, key: "key2" },
      { content: { value: 3 }, key: "key3" },
    ];

    await testRunner().run(async ({ synapse }) => {
      // Insert multiple locals
      for (const local of locals) {
        await synapse.db_postgres.updateLocal(unique_id, local.key, local.content);
      }

      // Load all locals
      const result = await synapse.db_postgres.loadLocals(unique_id);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);
      expect(result.get("key1")).toEqual({ value: 1 });
    });
  });

  it("should return empty map when no locals exist", async () => {
    expect.assertions(2);
    const unique_id = v4();

    await testRunner().run(async ({ synapse }) => {
      const result = await synapse.db_postgres.loadLocals(unique_id);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  it("should delete specific local by key", async () => {
    expect.assertions(2);
    const unique_id = v4();
    const key1 = "key1";
    const key2 = "key2";
    const content = { value: "test" };

    await testRunner().run(async ({ synapse, config }) => {
      // Insert two locals
      await synapse.db_postgres.updateLocal(unique_id, key1, content);
      await synapse.db_postgres.updateLocal(unique_id, key2, content);

      // Delete one local
      await synapse.db_postgres.deleteLocal(unique_id, key1);

      // Query database to verify only one local remains
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntityLocals)
        .where(
          and(
            eq(pgHomeAssistantEntityLocals.unique_id, unique_id),
            eq(pgHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(1);
      expect(rows[0].key).toBe(key2);
    });
  });

  it("should delete all locals for a unique_id", async () => {
    expect.assertions(1);
    const unique_id = v4();
    const locals = [
      { content: { value: 1 }, key: "key1" },
      { content: { value: 2 }, key: "key2" },
      { content: { value: 3 }, key: "key3" },
    ];

    await testRunner().run(async ({ synapse, config }) => {
      // Insert multiple locals
      for (const local of locals) {
        await synapse.db_postgres.updateLocal(unique_id, local.key, local.content);
      }

      // Delete all locals
      await synapse.db_postgres.deleteLocalsByUniqueId(unique_id);

      // Query database to verify all locals are deleted
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      const rows = await database
        .select()
        .from(pgHomeAssistantEntityLocals)
        .where(
          and(
            eq(pgHomeAssistantEntityLocals.unique_id, unique_id),
            eq(pgHomeAssistantEntityLocals.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );

      expect(rows).toHaveLength(0);
    });
  });

  it("should handle errors and re-throw them", async () => {
    expect.assertions(1);
    const unique_id = v4();
    const key = "test-key";
    const content = { status: "active" };

    await testRunner().run(async ({ synapse }) => {
      // Mock the database to throw an error
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;

      // Mock insert to throw an error
      vi.spyOn(database, "insert").mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      // Expect the updateLocal to throw an error
      await expect(synapse.db_postgres.updateLocal(unique_id, key, content)).rejects.toThrow(
        "Database connection failed",
      );

      // Restore the original insert method
      vi.restoreAllMocks();
    });
  });
});

describe("deleteEntity", () => {
  it("should delete entity when it exists", async () => {
    expect.assertions(2);
    const unique_id = v4();
    const content = { status: "active" };
    const defaults = { status: "default", value: 0 };

    await testRunner().run(async ({ synapse, config }) => {
      // First create an entity
      await synapse.db_postgres.update(unique_id, content, defaults);

      // Verify entity exists
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;
      let rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );
      expect(rows).toHaveLength(1);

      // Delete the entity
      await synapse.db_postgres.deleteEntity(unique_id);

      // Verify entity is deleted
      rows = await database
        .select()
        .from(pgHomeAssistantEntity)
        .where(
          and(
            eq(pgHomeAssistantEntity.unique_id, unique_id),
            eq(pgHomeAssistantEntity.app_unique_id, config.synapse.METADATA_UNIQUE_ID),
          ),
        );
      expect(rows).toHaveLength(0);
    });
  });

  it("should handle deleting non-existent entity gracefully", async () => {
    expect.assertions(1);
    const unique_id = v4();

    await testRunner().run(async ({ synapse }) => {
      // Try to delete an entity that doesn't exist
      await expect(synapse.db_postgres.deleteEntity(unique_id)).resolves.not.toThrow();
    });
  });

  it("should handle errors and re-throw them", async () => {
    expect.assertions(1);
    const unique_id = v4();

    await testRunner().run(async ({ synapse }) => {
      // Mock the database to throw an error
      const database = synapse.db_postgres.getDatabase() as PostgresJsDatabase;

      // Mock delete to throw an error
      vi.spyOn(database, "delete").mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      // Expect the deleteEntity to throw an error
      await expect(synapse.db_postgres.deleteEntity(unique_id)).rejects.toThrow(
        "Database connection failed",
      );

      // Restore the original delete method
      vi.restoreAllMocks();
    });
  });
});
