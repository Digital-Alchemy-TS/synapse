import { is, TServiceParams } from "@digital-alchemy/core";

import {
  LockConfiguration,
  LockValue,
  RemovableCallback,
  SynapseLockParams,
  SynapseVirtualLock,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

export function VirtualLock({ context, synapse, logger }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualLock>({
    context,
    // @ts-expect-error its fine
    domain: "lock",
  });

  return function create<
    STATE extends LockValue = LockValue,
    ATTRIBUTES extends object = object,
  >(entity: SynapseLockParams) {
    const proxy = new Proxy({} as SynapseVirtualLock, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualLock) {
        // > common
        // * name
        if (property === "name") {
          return entity.name;
        }
        // * unique_id
        if (property === "unique_id") {
          return unique_id;
        }
        // * onUpdate
        if (property === "onUpdate") {
          return loader.onUpdate();
        }
        // * _rawConfiguration
        if (property === "_rawConfiguration") {
          return loader.configuration;
        }
        // * _rawAttributes
        if (property === "_rawAttributes") {
          return loader.attributes;
        }
        // * attributes
        if (property === "attributes") {
          return loader.attributesProxy();
        }
        // * configuration
        if (property === "configuration") {
          return loader.configurationProxy();
        }
        // * state
        if (property === "state") {
          return loader.state;
        }
        // > domain specific
        // * onActivate
        if (property === "onUnlock") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(UNLOCK, callback);
        }
        // * onActivate
        if (property === "onLock") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(LOCK, callback);
        }
        // * onActivate
        if (property === "onOpen") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(OPEN, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onOpen",
        "onLock",
        "onUnlock",
      ],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<
      STATE,
      ATTRIBUTES,
      LockConfiguration
    >({
      load_keys: [
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
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [LOCK, UNLOCK, OPEN] = synapse.registry.busTransfer({
      context,
      eventName: ["lock", "unlock", "open"],
      unique_id,
    });

    // - Attach static listener
    if (entity.managed !== false) {
      logger.debug(
        { context: entity.context, name: entity.name },
        `setting up state management`,
      );
      proxy.onLock(() => (proxy.configuration.is_locked = true));
      proxy.onUnlock(() => (proxy.configuration.is_locked = false));
      proxy.onOpen(() => (proxy.configuration.is_open = true));
    }
    if (is.function(entity.open)) {
      proxy.onOpen(entity.open);
    }
    if (is.function(entity.lock)) {
      proxy.onOpen(entity.lock);
    }
    if (is.function(entity.unlock)) {
      proxy.onOpen(entity.unlock);
    }

    // - Done
    return proxy;
  };
}
