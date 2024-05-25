import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseFanParams = BaseEntityParams<FanStates> &
  FanConfiguration & {
    set_direction: RemovableCallback<{ direction: string }>;
    set_preset_mode: RemovableCallback<{ preset_mode: string }>;
    set_percentage: RemovableCallback<{ percentage: number }>;
    turn_on: RemovableCallback<{
      speed?: string;
      percentage?: number;
      preset_mode?: string;
    }>;
    turn_off: RemovableCallback;
    toggle: RemovableCallback;
    oscillate: RemovableCallback<{ oscillating: boolean }>;
  };

// supposed to be the same thing
type FanStates = "on" | "off";

export type FanConfiguration = EntityConfigCommon & {
  current_direction?: string;
  is_on?: boolean;
  oscillating?: boolean;
  percentage?: number;
  preset_mode?: string;
  preset_modes?: string[];
  speed_count?: number;
};

export type SynapseVirtualFan = BaseVirtualEntity<
  FanStates,
  object,
  FanConfiguration
> & {
  onSetDirection: CreateRemovableCallback<{ direction: string }>;
  onSetPresetMode: CreateRemovableCallback<{ preset_mode: string }>;
  onSetPercentage: CreateRemovableCallback<{ percentage: number }>;
  onTurnOn: CreateRemovableCallback;
  onTurnOff: CreateRemovableCallback;
  onToggle: CreateRemovableCallback;
  onOscillate: CreateRemovableCallback<{ oscillating: boolean }>;
};
