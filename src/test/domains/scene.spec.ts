import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Scene", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.scene({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: [],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
