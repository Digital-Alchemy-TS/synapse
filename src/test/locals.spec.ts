import {
  ApplicationDefinition,
  OptionalModuleConfiguration,
  ServiceMap,
  TServiceParams,
} from "@digital-alchemy/core";
import { join } from "path";
import { cwd, env } from "process";

import { CreateTestingApplication } from "./helpers";

describe("Locals", () => {
  let application: ApplicationDefinition<ServiceMap, OptionalModuleConfiguration>;
  const SQLITE_DB = join(cwd(), "jest_sqlite.db");
  env.SQLITE_DB = SQLITE_DB;

  afterEach(async () => {
    if (application) {
      await application.teardown();
      application = undefined;
    }
    jest.restoreAllMocks();
  });

  describe("area", () => {
    it("find entities by area", async () => {
      expect.assertions(1);
      application = CreateTestingApplication({
        Test({ synapse }: TServiceParams) {
          expect(synapse).toBeDefined();
        },
      });
      await application.bootstrap({
        configuration: {
          // boilerplate: { LOG_LEVEL: "silent" },
          hass: {
            AUTO_CONNECT_SOCKET: false,
            AUTO_SCAN_CALL_PROXY: false,
            MOCK_SOCKET: true,
          },
          synapse: { SQLITE_DB },
        },
      });
    });
  });
});
