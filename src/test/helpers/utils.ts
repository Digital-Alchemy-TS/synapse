import {
  ApplicationDefinition,
  BootstrapOptions,
  CreateApplication,
  deepExtend,
  is,
  OptionalModuleConfiguration,
  PartialConfiguration,
  ServiceFunction,
  ServiceMap,
  TBlackHole,
  TServiceParams,
} from "@digital-alchemy/core";
import { HassConfig, LIB_HASS } from "@digital-alchemy/hass";
import { LIB_MOCK_ASSISTANT } from "@digital-alchemy/hass/mock-assistant";
import { existsSync, rmSync } from "fs";
import { join } from "path";
import { cwd } from "process";

import { LIB_SYNAPSE } from "../../synapse.module";

function Rewire({ hass }: TServiceParams) {
  jest
    .spyOn(hass.fetch, "getConfig")
    .mockImplementation(async () => ({ version: "2024.4.1" }) as HassConfig);
}
export const SILENT_BOOT = (
  configuration: PartialConfiguration = {},
  fixtures = false,
  rewire = true,
): BootstrapOptions => ({
  appendLibrary: fixtures ? LIB_MOCK_ASSISTANT : undefined,
  appendService: rewire ? { Rewire } : undefined,
  configuration,
  // quiet time
  customLogger: {
    debug: () => {},
    error: () => {},
    fatal: () => {},
    info: () => {},
    trace: () => {},
    warn: () => {},
  },
});
const SQLITE_DB = join(cwd(), "jest_sqlite.db");
type TestingOptions = {
  keepDb?: boolean;
};

let application: ApplicationDefinition<ServiceMap, OptionalModuleConfiguration>;
afterEach(async () => {
  if (application) {
    await application.teardown();
    application = undefined;
  }
});

let tParams: TServiceParams;
export const CHECK_LOAD_CONFIG_KEYS = (load_config_keys: string[], callback: () => TBlackHole) => {
  const spy = jest.spyOn(tParams.synapse.storage, "add");
  callback();

  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ load_config_keys }));
};

export function TestRunner(
  Test: ServiceFunction,
  { keepDb: keepDatabase = false }: TestingOptions = {},
) {
  application = CreateApplication({
    configurationLoaders: [],
    libraries: [LIB_HASS, LIB_SYNAPSE],
    // @ts-expect-error testing
    name: "testing",
    services: {
      Loader(params) {
        const { lifecycle, internal } = params;
        tParams = params;
        lifecycle.onPreInit(() => {
          internal.boilerplate.configuration.set("synapse", "SQLITE_DB", SQLITE_DB);
          if (!keepDatabase && existsSync(SQLITE_DB)) {
            rmSync(SQLITE_DB);
          }
        });
      },
      Test,
    },
  });
  return application;
}

export const BASIC_BOOT = {
  configuration: {
    boilerplate: { LOG_LEVEL: "silent" },
    hass: {
      AUTO_CONNECT_SOCKET: false,
      AUTO_SCAN_CALL_PROXY: false,
      MOCK_SOCKET: true,
    },
    synapse: {
      ASSUME_INSTALLED: true,
      SQLITE_DB,
    },
  },
} satisfies BootstrapOptions;

export const CONFIG_BOOT = (configuration: PartialConfiguration) =>
  deepExtend(BASIC_BOOT, { configuration });

export const CreateTestRunner = <S extends ServiceMap, C extends OptionalModuleConfiguration>(
  UNIT_TESTING_APP: ApplicationDefinition<S, C>,
) => {
  // setup runs at construction
  // test runs at ready
  return async function (setup: ServiceFunction, Test: ServiceFunction) {
    function test(params: TServiceParams) {
      const { lifecycle, config } = params;
      lifecycle.onReady(async () => await Test(params));
      lifecycle.onPreInit(() => {
        if (existsSync(config.synapse.SQLITE_DB)) {
          rmSync(config.synapse.SQLITE_DB);
        }
      });
    }
    return await UNIT_TESTING_APP.bootstrap({
      appendLibrary: LIB_MOCK_ASSISTANT,
      appendService: is.function(setup) ? { Rewire, setup, test } : { Rewire, test },
      configuration: {
        boilerplate: { LOG_LEVEL: "silent" },
        hass: {
          AUTO_CONNECT_SOCKET: false,
          AUTO_SCAN_CALL_PROXY: false,
          MOCK_SOCKET: true,
        },
        synapse: { SQLITE_DB },
      },
    });
  };
};
