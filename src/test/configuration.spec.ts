import { TServiceParams } from "@digital-alchemy/core";
import { DeviceDetails, HassConfig, MIN_SUPPORTED_HASS_VERSION } from "@digital-alchemy/hass";
import { v4 } from "uuid";

import { BASIC_BOOT, CONFIG_BOOT, TestRunner } from "./helpers";

const NOT_INSTALLED = {
  components: [],
  version: MIN_SUPPORTED_HASS_VERSION,
} as HassConfig;
const INSTALLED = {
  components: ["synapse"],
  version: MIN_SUPPORTED_HASS_VERSION,
} as HassConfig;

describe("Configuration", () => {
  afterEach(() => jest.restoreAllMocks());

  // #MARK: isRegistered
  describe("isRegistered", () => {
    it("returns false before checks", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse }: TServiceParams) => {
        expect(synapse.configure.isRegistered()).toBe(false);
      }).bootstrap(BASIC_BOOT);
    });

    it("fails for not installed", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse, lifecycle, hass }: TServiceParams) => {
        jest.spyOn(hass.fetch, "getConfig").mockImplementation(async () => NOT_INSTALLED);
        lifecycle.onReady(() => {
          expect(synapse.configure.isRegistered()).toBe(false);
        });
      }).bootstrap(CONFIG_BOOT({ synapse: { ASSUME_INSTALLED: false } }));
    });

    it("fails for installed but no device", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse, hass, lifecycle }: TServiceParams) => {
        jest.spyOn(hass.fetch, "getConfig").mockImplementation(async () => INSTALLED);
        lifecycle.onReady(() => {
          hass.device.current = [];
          expect(synapse.configure.isRegistered()).toBe(false);
        });
      }).bootstrap(BASIC_BOOT);
    });

    it("passes for installed and with device", async () => {
      expect.assertions(1);
      const METADATA_UNIQUE_ID = v4();
      await TestRunner(({ synapse, hass, lifecycle }: TServiceParams) => {
        jest.spyOn(hass.fetch, "getConfig").mockImplementation(async () => INSTALLED);
        lifecycle.onReady(() => {
          hass.device.current = [
            { identifiers: [[undefined, METADATA_UNIQUE_ID]] } as DeviceDetails,
          ];
          expect(synapse.configure.isRegistered()).toBe(true);
        });
      }).bootstrap(CONFIG_BOOT({ synapse: { METADATA_UNIQUE_ID } }));
    });
  });

  // #MARK: checkInstallState
  describe("checkInstallState", () => {
    it("passes when ASSUME_INSTALLED is true by default", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse, lifecycle }: TServiceParams) => {
        lifecycle.onReady(async () => {
          expect(await synapse.configure.checkInstallState()).toBe(true);
        });
      }).bootstrap(CONFIG_BOOT({ synapse: { ASSUME_INSTALLED: true } }));
    });

    it("fails when ASSUME_INSTALLED is false and integration does not exist", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse, hass, lifecycle }: TServiceParams) => {
        jest.spyOn(hass.fetch, "getConfig").mockImplementation(async () => NOT_INSTALLED);
        lifecycle.onReady(async () => {
          jest.useFakeTimers();
          expect(await synapse.configure.checkInstallState()).toBe(false);
          jest.useRealTimers();
        });
      }).bootstrap(CONFIG_BOOT({ synapse: { ASSUME_INSTALLED: false } }));
    });

    it("passes when ASSUME_INSTALLED is false and integration does exist", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse, hass, lifecycle }: TServiceParams) => {
        jest.spyOn(hass.fetch, "getConfig").mockImplementation(async () => INSTALLED);
        lifecycle.onReady(async () => {
          jest.useFakeTimers();
          expect(await synapse.configure.checkInstallState()).toBe(true);
          jest.useRealTimers();
        });
      }).bootstrap(CONFIG_BOOT({ synapse: { ASSUME_INSTALLED: false } }));
    });
  });
});
