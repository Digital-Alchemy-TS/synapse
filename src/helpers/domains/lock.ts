import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseLockParams = BaseEntityParams<LockValue> &
  LockConfiguration & {
    /**
     * default: true
     */
    managed?: boolean;
    lock?: RemovableCallback;
    unlock?: RemovableCallback;
    open?: RemovableCallback;
  };

export type LockConfiguration = EntityConfigCommon & {
  /**
   * Describes what the last change was triggered by.
   */
  changed_by?: string;
  /**
   * Regex for code format or None if no code is required.
   */
  code_format?: string;
  /**
   * Indication of whether the lock is currently locked. Used to determine state.
   */
  is_locked?: boolean;
  /**
   * Indication of whether the lock is currently locking. Used to determine state.
   */
  is_locking?: boolean;
  /**
   * Indication of whether the lock is currently unlocking. Used to determine state.
   */
  is_unlocking?: boolean;
  /**
   * Indication of whether the lock is currently jammed. Used to determine state.
   */
  is_jammed?: boolean;
  /**
   * Indication of whether the lock is currently opening. Used to determine state.
   */
  is_opening?: boolean;
  /**
   *
   */
  is_open?: boolean;
  supported_features?: number;
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
