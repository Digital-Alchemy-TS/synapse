import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseSirenParams = BaseEntityParams<SirenStates> &
  SirenConfiguration & {
    turn_on?: RemovableCallback;
    turn_off?: RemovableCallback;
  };

// supposed to be the same thing
type SirenStates = "opening" | "open" | "closing" | "closed";

export type SirenConfiguration = EntityConfigCommon & {
  is_on?: boolean;
  available_tones?: string[];
  supported_features?: number;
};

export type SynapseVirtualSiren = BaseVirtualEntity<
  SirenStates,
  object,
  SirenConfiguration
> & {
  onTurnOn?: CreateRemovableCallback;
  onTurnOff?: CreateRemovableCallback;
};
