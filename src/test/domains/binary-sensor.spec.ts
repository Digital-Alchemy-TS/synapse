import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Binary Sensor", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.binary_sensor({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: ["device_class", "is_on"],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
