import {
  ApplicationDefinition,
  OptionalModuleConfiguration,
  ServiceMap,
  TServiceParams,
} from "@digital-alchemy/core";
import fs from "fs";
import os from "os";
import process from "process";
import { v4 } from "uuid";

import { BASIC_BOOT, CreateTestingApplication, SPECIAL_BOOT } from "./helpers";

describe("Configuration", () => {
  let application: ApplicationDefinition<ServiceMap, OptionalModuleConfiguration>;

  afterEach(async () => {
    if (application) {
      await application.teardown();
      application = undefined;
    }
    jest.restoreAllMocks();
  });

  // #MARK: isRegistered
  describe("loadVersion", () => {
    it("returns existing version if set", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          const version = v4();
          synapse.device.setVersion(version);
          expect(synapse.device.loadVersion()).toBe(version);
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });

    it("loads version from package.json if synapseVersion is not set", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          const version = v4();
          const packageJson = JSON.stringify({ version });

          jest.spyOn(fs, "existsSync").mockReturnValue(true);
          jest.spyOn(fs, "readFileSync").mockReturnValue(packageJson);

          expect(synapse.device.loadVersion()).toBe(version);
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });

    it("returns undefined if package.json does not exist", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          jest.spyOn(fs, "existsSync").mockReturnValueOnce(false);
          expect(synapse.device.loadVersion()).toBeUndefined();
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });

    it("logs an error and returns undefined if reading package.json fails", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          jest.spyOn(fs, "existsSync").mockReturnValueOnce(true);

          jest.spyOn(fs, "readFileSync").mockImplementationOnce(() => {
            throw new Error("File read error");
          });

          expect(synapse.device.loadVersion()).toBeUndefined();
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });
  });

  // #MARK: getInfo
  describe("getInfo", () => {
    it("formats data", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse, config }: TServiceParams) {
          const version = v4();
          synapse.device.setVersion(version);
          expect(synapse.device.getInfo()).toEqual({
            manufacturer: "Digital Alchemy",
            name: "testing",
            sw_version: version,
            ...config.synapse.METADATA,
          });
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });
  });

  // #MARK: getInfo
  fdescribe("id", () => {
    fit("default id", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          jest.spyOn(process, "cwd").mockImplementationOnce(() => `/app`);
          jest.spyOn(os, "hostname").mockImplementationOnce(() => `test_host`);
          const id = synapse.device.id();
          console.error({ id });
          expect(id).toBe("d3fbf239-3650-904b-6527-7ca5b6ad4eb2");
        },
      });
      await application.bootstrap(
        SPECIAL_BOOT({
          boilerplate: { LOG_LEVEL: "trace" },
        }),
      );
    });

    it("formats according to provided params string", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          expect(synapse.device.id("foo_bar")).toBe("5c7d96a3-dd7a-8785-0a2e-f34087565a6e");
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });

    it("formats according to provided params array", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          expect(
            synapse.device.id(["some", "long", "list", "of", "properties", "and", "stuff"]),
          ).toBe("5b36913f-269e-1c89-1232-33e8b3722f91");
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });
  });

  // #MARK: getInfo
  describe("list", () => {
    xit("default id", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          jest.spyOn(process, "cwd").mockImplementationOnce(() => `/app`);
          jest.spyOn(os, "hostname").mockImplementationOnce(() => `test_host`);
          expect(synapse.device.id()).toBe("d3fbf239-3650-904b-6527-7ca5b6ad4eb2");
        },
      });
      await application.bootstrap(BASIC_BOOT);
    });
  });
});
