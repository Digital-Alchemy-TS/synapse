import type { TServiceParams } from "@digital-alchemy/core";

import type {
  SynapseServiceCreate,
  SynapseServiceCreateCallback,
  SynapseServiceCreateOptions,
  SynapseServiceListField,
} from "../index.mts";

export function ServiceService({ synapse, logger }: TServiceParams): SynapseServiceCreate {
  return function <SCHEMA extends SynapseServiceListField>(
    options: SynapseServiceCreateOptions<SCHEMA>,
    callback: SynapseServiceCreateCallback,
  ) {
    // if( syn)
  };
}
