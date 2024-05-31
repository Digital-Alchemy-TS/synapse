import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseSceneParams = BaseEntityParams<never> &
  SceneConfiguration & {
    activate?: RemovableCallback;
  };

export type SceneConfiguration = EntityConfigCommon;

export type SynapseVirtualScene = BaseVirtualEntity<never, object, SceneConfiguration> & {
  onActivate: CreateRemovableCallback;
};
