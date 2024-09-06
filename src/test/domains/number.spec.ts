import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Number", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.number({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: [
            "device_class",
            "unit_of_measurement",
            "mode",
            "native_max_value",
            "native_min_value",
            "step",
            "native_value",
          ],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
