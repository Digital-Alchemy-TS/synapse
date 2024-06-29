import { CreateApplication } from "@digital-alchemy/core";
import { LIB_FASTIFY } from "@digital-alchemy/fastify-extension";
import { LIB_HASS } from "@digital-alchemy/hass";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import isBetween from "dayjs/plugin/isBetween";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import weekOfYear from "dayjs/plugin/weekOfYear";

import { LIB_SYNAPSE } from "../synapse.module";
import { EntityGenerator } from "./generator";

dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);
dayjs.extend(isBetween);
dayjs.extend(utc);
dayjs.extend(timezone);

export const ENTITY_GENERATOR = CreateApplication({
  libraries: [LIB_HASS, LIB_SYNAPSE],
  name: "entity_generator",
  services: {
    generator: EntityGenerator,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    entity_generator: typeof ENTITY_GENERATOR;
  }
}

setImmediate(
  async () =>
    await ENTITY_GENERATOR.bootstrap({
      configuration: {
        boilerplate: { LOG_LEVEL: "debug" },
        fastify: { PORT: 3000 },
        synapse: {
          METADATA: {
            hw_version: "0.0.1",
            suggested_area: "Living Room",
          },
          METADATA_TITLE: "Synapse Mocks",
        },
      },
    }),
);
