import { v4 } from "uuid";

import { BASIC_BOOT, TestRunner } from "./helpers";

describe("Storage", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("init", () => {
    it("creates storage at construction", async () => {
      await TestRunner(({ synapse, context }) => {
        const spy = jest.spyOn(synapse.storage, "add");
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
      }).bootstrap(BASIC_BOOT);
    });

    it("uses unique_id if provided", async () => {
      await TestRunner(async ({ synapse, context }) => {
        const unique_id = v4();
        let provided: string;
        // @ts-expect-error I don't care
        jest.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
          provided = entity.unique_id;
          return { keys: () => [] };
        });
        synapse.sensor({ context, name: "test", unique_id });
        expect(provided).toEqual(unique_id);
      }).bootstrap(BASIC_BOOT);
    });

    it("generates unique_id using preferring suggested_object_id ", async () => {
      await TestRunner(async ({ synapse, context }) => {
        let provided: string;
        // @ts-expect-error I don't care
        jest.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
          provided = entity.unique_id;
          return { keys: () => [] };
        });
        synapse.sensor({ context, name: "test", suggested_object_id: "captain_sensor" });
        expect(provided).toEqual(
          "3eba7e8ab4c19c57807bd5a00b6ed5721e1161241fd741279791fb969a5a224d",
        );
      }).bootstrap(BASIC_BOOT);
    });

    it("generates unique_id using using name as a fallback", async () => {
      await TestRunner(async ({ synapse, context }) => {
        let provided: string;
        // @ts-expect-error I don't care
        jest.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
          provided = entity.unique_id;
          return { keys: () => [] };
        });
        synapse.sensor({ context, name: "test" });
        expect(provided).toEqual(
          "4a2f90672e3239b1241c540ec3f504b4a91d39cd6dbcf50de16fce837925549b",
        );
      }).bootstrap(BASIC_BOOT);
    });
  });

  it("generates unique_id using using name as a fallback", async () => {
    await TestRunner(async ({ synapse, context }) => {
      let provided: string;
      // @ts-expect-error I don't care
      jest.spyOn(synapse.storage, "add").mockImplementation(({ entity }) => {
        provided = entity.unique_id;
        return { keys: () => [] };
      });
      synapse.sensor({ context, name: "test" });
      expect(provided).toEqual("4a2f90672e3239b1241c540ec3f504b4a91d39cd6dbcf50de16fce837925549b");
    }).bootstrap(BASIC_BOOT);
  });
});
