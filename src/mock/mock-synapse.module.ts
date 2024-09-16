import { CreateLibrary, createModule } from "@digital-alchemy/core";
import { LIB_HASS } from "@digital-alchemy/hass";
import { LIB_MOCK_ASSISTANT } from "@digital-alchemy/hass/mock-assistant";

import { LIB_SYNAPSE } from "../synapse.module";
import { MockSynapseConfiguration } from "./extensions";

export const LIB_MOCK_SYNAPSE = CreateLibrary({
  configuration: {},
  depends: [LIB_HASS, LIB_SYNAPSE],
  name: "mock_synapse",
  priorityInit: [],
  services: {
    config: MockSynapseConfiguration,
  },
});

declare module "@digital-alchemy/core" {
  export interface LoadedModules {
    mock_synapse: typeof LIB_MOCK_SYNAPSE;
  }
}

export const synapseTestRunner = createModule
  .fromLibrary(LIB_SYNAPSE)
  .extend()
  .toTest()
  .appendLibrary(LIB_MOCK_SYNAPSE)
  .appendLibrary(LIB_MOCK_ASSISTANT);
