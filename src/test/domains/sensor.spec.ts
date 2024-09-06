import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Sensor", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.sensor({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: [
            "device_class",
            "last_reset",
            "state",
            "suggested_display_precision",
            "suggested_unit_of_measurement",
            "unit_of_measurement",
          ],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
