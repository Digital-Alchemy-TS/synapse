import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Time", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.time({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: ["native_value"],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
