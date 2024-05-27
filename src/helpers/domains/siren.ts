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

type SirenStates = "opening" | "open" | "closing" | "closed";

export type SirenConfiguration = EntityConfigCommon & {
  /**
   * Whether the device is on or off.
   */
  is_on?: boolean;
  /**
   * The list or dictionary of available tones on the device to pass into the turn_on service.
   * If a dictionary is provided, when a user uses the dict value of a tone,
   * it will get converted to the corresponding dict key before being passed on to the integration platform.
   * Requires SUPPORT_TONES feature.
   */
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
