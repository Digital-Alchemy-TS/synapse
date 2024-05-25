import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseLockParams = BaseEntityParams<LockValue> & LockConfiguration;

export type LockConfiguration = EntityConfigCommon & {
  changed_by?: string;
  code_format?: string;
  is_locked?: boolean;
  is_locking?: boolean;
  is_unlocking?: boolean;
  is_jammed?: boolean;
  is_opening?: boolean;
  is_open?: boolean;
  supported_features?: number;
  /**
   * default: true
   */
  managed?: boolean;
  lock?: RemovableCallback;
  unlock?: RemovableCallback;
  open?: RemovableCallback;
};

export type LockValue = "locked" | "unlocked";

export type SynapseVirtualLock = BaseVirtualEntity<
  never,
  object,
  LockConfiguration
> & {
  onUnlock: CreateRemovableCallback;
  onLock: CreateRemovableCallback;
  onOpen: CreateRemovableCallback;
};
