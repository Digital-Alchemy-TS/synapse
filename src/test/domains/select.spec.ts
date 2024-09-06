import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Select", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.select({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: ["current_option", "options"],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
