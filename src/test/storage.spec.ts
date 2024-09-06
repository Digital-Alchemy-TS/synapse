import { BASIC_BOOT, TestRunner } from "./helpers";

describe("Storage", () => {
  afterEach(() => jest.restoreAllMocks());

  it("creates storage at construction", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.sensor({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith({
        domain: "sensor",
        entity: expect.objectContaining({ name: "test" }),
        load_config_keys: [
          "device_class",
          "last_reset",
          "state",
          "suggested_display_precision",
          "suggested_unit_of_measurement",
          "unit_of_measurement",
        ],
      });
    }).bootstrap(BASIC_BOOT);
  });
});
