import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions, SettableConfiguration } from "../..";

export type LockConfiguration = {
  /**
   * Describes what the last change was triggered by.
   */
  changed_by?: SettableConfiguration<string>;
  /**
   * Regex for code format or None if no code is required.
   */
  code_format?: SettableConfiguration<string>;
  /**
   * Indication of whether the lock is currently locked. Used to determine state.
   */
  is_locked?: SettableConfiguration<boolean>;
  /**
   * Indication of whether the lock is currently locking. Used to determine state.
   */
  is_locking?: SettableConfiguration<boolean>;
  /**
   * Indication of whether the lock is currently unlocking. Used to determine state.
   */
  is_unlocking?: SettableConfiguration<boolean>;
  /**
   * Indication of whether the lock is currently jammed. Used to determine state.
   */
  is_jammed?: SettableConfiguration<boolean>;
  /**
   * Indication of whether the lock is currently opening. Used to determine state.
   */
  is_opening?: SettableConfiguration<boolean>;
  /**
   *
   */
  is_open?: SettableConfiguration<boolean>;
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

  return function <ATTRIBUTES extends object, LOCALS extends object>({
    managed = true,
    ...options
  }: AddEntityOptions<LockConfiguration, LockEvents, ATTRIBUTES, LOCALS>) {
    const entity = generate.addEntity(options);
    if (managed) {
      entity.onLock(({}) => entity.storage.set("is_locked", true));
      entity.onUnlock(({}) => entity.storage.set("is_locked", false));
      entity.onOpen(({}) => entity.storage.set("is_open", true));
    }
    return entity;
  };
}
