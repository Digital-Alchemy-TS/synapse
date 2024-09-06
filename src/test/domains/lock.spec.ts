import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Lock", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.lock({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: [
            "changed_by",
            "code_format",
            "is_locked",
            "is_locking",
            "is_unlocking",
            "is_jammed",
            "is_opening",
            "is_open",
            "supported_features",
          ],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });
});
