import { TServiceParams } from "@digital-alchemy/core";

import { AddEntityOptions } from "../..";

type EntityConfiguration = {
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

type EntityEvents = {
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
  const generate = synapse.generator.create<EntityConfiguration, EntityEvents>({
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

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<EntityConfiguration, EntityEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
