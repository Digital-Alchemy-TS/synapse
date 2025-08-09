import { ENTITY_REGISTRY_UPDATED } from "@digital-alchemy/hass";
import { v4 } from "uuid";

import { synapseTestRunner } from "../mock/index.mts";

describe("Storage", () => {
  afterEach(async () => {
    await synapseTestRunner.teardown();
    vi.restoreAllMocks();
  });

  describe("init", () => {
    it("creates storage at construction", async () => {
      await synapseTestRunner.run(({ synapse, context }) => {
        const spy = vi.spyOn(synapse.storage, "add");
        synapse.sensor({ context, name: "test" });
        expect(spy).toHaveBeenCalledWith({
          domain: "sensor",
          entity: expect.objectContaining({ name: "test" }),
          load_config_keys: expect.arrayContaining([
            "device_class",
            "last_reset",
            "state",
            "suggested_display_precision",
            "suggested_unit_of_measurement",
            "unit_of_measurement",
          ]),
        });
      });
    });

    it("uses unique_id if provided", async () => {
      await synapseTestRunner.run(async ({ synapse, context }) => {
        const unique_id = v4();
        let provided: string;
        // @ts-expect-error I don't care
        vi.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
          provided = entity.unique_id;
          return { keys: () => [] };
        });
        synapse.sensor({ context, name: "test", unique_id });
        expect(provided).toEqual(unique_id);
      });
    });

    it("generates unique_id using preferring suggested_object_id ", async () => {
      await synapseTestRunner.run(async ({ synapse, context }) => {
        let provided: string;
        // @ts-expect-error I don't care
        vi.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
          provided = entity.unique_id;
          return { keys: () => [] };
        });
        synapse.sensor({ context, name: "test", suggested_object_id: "captain_sensor" });
        expect(provided).toEqual(
          "3eba7e8ab4c19c57807bd5a00b6ed5721e1161241fd741279791fb969a5a224d",
        );
      });
    });

    it("generates unique_id using using name as a fallback", async () => {
      await synapseTestRunner.run(async ({ synapse, context }) => {
        let provided: string;
        // @ts-expect-error I don't care
        vi.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
          provided = entity.unique_id;
          return { keys: () => [] };
        });
        synapse.sensor({ context, name: "test" });
        expect(provided).toEqual(
          "4a2f90672e3239b1241c540ec3f504b4a91d39cd6dbcf50de16fce837925549b",
        );
      });
    });
  });

  describe("entity registry update", () => {
    it("calls database.update for all entities when entity registry is updated", async () => {
      await synapseTestRunner.run(async ({ synapse, context, event }) => {
        // Create real entities with unique IDs
        const unique_id1 = v4();
        const unique_id2 = v4();

        // Mock database.update to track calls
        const databaseUpdateSpy = vi.spyOn(synapse.database, "update").mockResolvedValue();

        // Create actual entities - this will register them in the storage registry
        synapse.sensor({ context, name: "test1", unique_id: unique_id1 });
        synapse.sensor({ context, name: "test2", unique_id: unique_id2 });

        // Clear any initial calls that might have happened during entity creation
        databaseUpdateSpy.mockClear();

        // Trigger entity registry update event using the proper event system
        event.emit(ENTITY_REGISTRY_UPDATED);

        // Wait for debounce and async operations
        await new Promise(resolve => setTimeout(resolve, 600)); // RESYNC_DELAY is HALF * SECOND = 500ms

        // Verify database.update was called for each entity
        expect(databaseUpdateSpy).toHaveBeenCalledTimes(2);

        // Verify the calls include the unique IDs (exact export data will vary based on entity defaults)
        expect(databaseUpdateSpy).toHaveBeenCalledWith(unique_id1, expect.any(Object));
        expect(databaseUpdateSpy).toHaveBeenCalledWith(unique_id2, expect.any(Object));

        // Verify the export data contains expected properties for sensor entities
        const calls = databaseUpdateSpy.mock.calls;
        calls.forEach(([id, exportData]) => {
          expect([unique_id1, unique_id2]).toContain(id);
          expect(exportData).toBeTypeOf("object");
        });
      });
    });
  });

  describe("dump", () => {
    it("organizes entities by domain and exports their data correctly", async () => {
      await synapseTestRunner.run(async ({ synapse, context }) => {
        // Create entities from different domains
        const sensorId1 = v4();
        const sensorId2 = v4();
        const switchId = v4();
        const buttonId = v4();

        // Create entities with some configuration
        synapse.sensor({
          context,
          device_class: "temperature",
          name: "temperature_sensor",
          unique_id: sensorId1,
          unit_of_measurement: "°C",
        });

        synapse.sensor({
          context,
          device_class: "humidity",
          name: "humidity_sensor",
          unique_id: sensorId2,
          unit_of_measurement: "%",
        });

        synapse.switch({
          context,
          device_class: "outlet",
          name: "test_switch",
          unique_id: switchId,
        });

        synapse.button({
          context,
          device_class: "restart",
          name: "test_button",
          unique_id: buttonId,
        });

        // Call dump to get the organized data
        const dumpResult = synapse.storage.dump();

        // Verify the structure has the expected domains
        expect(dumpResult).toHaveProperty("sensor");
        expect(dumpResult).toHaveProperty("switch");
        expect(dumpResult).toHaveProperty("button");

        // Verify sensor domain has 2 entities
        expect(dumpResult.sensor).toHaveLength(2);
        expect(dumpResult.switch).toHaveLength(1);
        expect(dumpResult.button).toHaveLength(1);

        // Verify sensor entities contain expected exported data
        const sensorExports = dumpResult.sensor;
        expect(sensorExports).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              device_class: "temperature",
              name: "temperature_sensor",
              unit_of_measurement: "°C",
            }),
            expect.objectContaining({
              device_class: "humidity",
              name: "humidity_sensor",
              unit_of_measurement: "%",
            }),
          ]),
        );

        // Verify switch entity contains expected data
        expect(dumpResult.switch[0]).toEqual(
          expect.objectContaining({
            device_class: "outlet",
            name: "test_switch",
          }),
        );

        // Verify button entity contains expected data
        expect(dumpResult.button[0]).toEqual(
          expect.objectContaining({
            device_class: "restart",
            name: "test_button",
          }),
        );

        // Verify each entity export contains the required unique_id
        [...sensorExports, ...dumpResult.switch, ...dumpResult.button].forEach(entityData => {
          expect(entityData).toHaveProperty("unique_id");
          expect([sensorId1, sensorId2, switchId, buttonId]).toContain(
            (entityData as Record<string, unknown>).unique_id,
          );
        });
      });
    });
  });

  it("generates unique_id using using name as a fallback", async () => {
    await synapseTestRunner.run(async ({ synapse, context }) => {
      let provided: string;
      // @ts-expect-error I don't care
      vi.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
        provided = entity.unique_id;
        return { keys: () => [] };
      });
      synapse.sensor({ context, name: "test" });
      expect(provided).toEqual("4a2f90672e3239b1241c540ec3f504b4a91d39cd6dbcf50de16fce837925549b");
    });
  });
});
