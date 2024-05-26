import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseLightParams = BaseEntityParams<LightStates> &
  LightConfiguration & {
    turn_on?: RemovableCallback;
    turn_off?: RemovableCallback;
  };

// supposed to be the same thing
type LightStates = "opening" | "open" | "closing" | "closed";

export type LightConfiguration = EntityConfigCommon & {
  brightness?: number;
  color_mode?: string;
  color_temp_kelvin?: number;
  effect?: string;
  effect_list?: string[];
  hs_color?: [number, number];
  is_on?: boolean;
  max_color_temp_kelvin?: number;
  min_color_temp_kelvin?: number;
  rgb_color?: [r: number, g: number, b: number];
  rgbw_color?: [r: number, g: number, b: number, w: number];
  rgbww_color?: [r: number, g: number, b: number, w: number, w: number];
  supported_color_modes?: string[];
  supported_features?: number;
  xy_color?: [number, number];
};

export type SynapseVirtualLight = BaseVirtualEntity<
  LightStates,
  object,
  LightConfiguration
> & {
  onTurnOn?: CreateRemovableCallback;
  onTurnOff?: CreateRemovableCallback;
};
