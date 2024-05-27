import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseFanParams = BaseEntityParams<FanStates> &
  FanConfiguration & {
    set_direction?: RemovableCallback<{ direction: string }>;
    set_preset_mode?: RemovableCallback<{ preset_mode: string }>;
    set_percentage?: RemovableCallback<{ percentage: number }>;
    turn_on?: RemovableCallback<{
      speed?: string;
      percentage?: number;
      preset_mode?: string;
    }>;
    turn_off?: RemovableCallback;
    toggle?: RemovableCallback;
    oscillate?: RemovableCallback<{ oscillating: boolean }>;
  };

type FanStates = "on" | "off";

export type FanConfiguration = EntityConfigCommon & {
  /**
   * The current direction of the fan.
   */
  current_direction?: string;
  /**
   * True if the fan is on.
   */
  is_on?: boolean;
  /**
   * True if the fan is oscillating.
   */
  oscillating?: boolean;
  /**
   * The current speed percentage. Must be a value between 0 (off) and 100.
   */
  percentage?: number;
  /**
   * The current preset_mode. One of the values in preset_modes or None if no preset is active.
   */
  preset_mode?: string;
  /**
   * The list of supported preset_modes. This is an arbitrary list of str and should not contain any speeds.
   */
  preset_modes?: string[];
  /**
   * The number of speeds the fan supports.
   */
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
