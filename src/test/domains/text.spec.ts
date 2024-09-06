import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Text", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.text({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: ["mode", "native_max", "native_min", "pattern", "native_value"],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
