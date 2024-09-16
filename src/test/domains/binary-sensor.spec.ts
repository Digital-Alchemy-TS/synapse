import { synapseTestRunner } from "../../mock";

describe("Binary Sensor", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await synapseTestRunner.run(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.binary_sensor({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: ["device_class", "is_on"],
        }),
      );
    });
  });
});
