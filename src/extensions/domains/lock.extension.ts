import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

export type LockConfiguration = {
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
  /**
   * default: true
   */
  managed?: boolean;
};

export type LockEvents = {
  lock: {
    //
  };
  unlock: {
    //
  };
  open: {
    //
  };
};

export function VirtualLock({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<LockConfiguration, LockEvents>({
    bus_events: ["lock", "unlock", "open"],
    context,
    // @ts-expect-error its fine
    domain: "lock",
    load_config_keys: [
      "changed_by",
      "code_format",
      "is_locked",
      "is_locking",
      "is_unlocking",
      "is_jammed",
      "is_opening",
      "is_open",
      "supported_features",
    ],
  });

  return function <ATTRIBUTES extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<LockConfiguration, LockEvents, ATTRIBUTES>) {
    const entity = generate.add_entity(options);
    if (managed) {
      entity.onLock(({}) => entity.storage.set("is_locked", true));
      entity.onUnlock(({}) => entity.storage.set("is_locked", false));
      entity.onOpen(({}) => entity.storage.set("is_open", true));
    }
    return entity;
  };
}
