import type { TServiceParams } from "@digital-alchemy/core";
import type { ANY_ENTITY, ENTITY_STATE } from "@digital-alchemy/hass";

import type { TSynapseId } from "../../helpers/index.mts";

/**
 * Bridges synapse storage.set to the hass mock event bus.
 *
 * For each synapse entity:
 * 1. At storage.add time, records the entity and its derived entity_id.
 * 2. On storage.set, emits one state_changed via mock_assistant.entity.emitChange.
 * 3. Reentry guard (bridgeEmitting set) prevents the storage.set -> bridge ->
 *    socket -> event.on(unique_id) -> storage.set loop (F6).
 * 4. Pre-connect emits are queued and flushed after socket connects (F5).
 */
export function SynapseHassBridge({
  synapse,
  hass,
  mock_assistant,
  lifecycle,
  logger,
  internal,
}: TServiceParams) {
  const { is } = internal.utils;

  // Queue for pre-connect emits (F5: defer until socket connected)
  const pendingEmits: Array<() => Promise<void>> = [];
  let socketConnected = false;

  // Map unique_id -> derived entity_id
  const entityIdMap = new Map<string, string>();

  // Track in-flight bridge emits to prevent re-entrant storage.set (F6)
  const bridgeEmitting = new Set<string>();

  hass.socket.onConnect(() => {
    socketConnected = true;
    void (async () => {
      while (!is.empty(pendingEmits)) {
        const emit = pendingEmits.shift();
        await emit?.();
      }
    })();
  });

  /**
   * Derive entity_id for a synapse entity as "{domain}.{suggested_object_id}".
   * This mirrors what HA assigns when registering via the integration.
   */
  function deriveEntityId(domain: string, suggested_object_id: string): string {
    return `${domain}.${suggested_object_id}`;
  }

  async function bridgeEmit(unique_id: string): Promise<void> {
    const entity_id = entityIdMap.get(unique_id);
    if (!entity_id) {
      logger.trace({ unique_id }, "bridge: no entity_id mapped, skipping");
      return;
    }

    if (bridgeEmitting.has(unique_id)) {
      logger.trace({ unique_id }, "bridge: skipping reentrant emit (F6)");
      return;
    }

    const doEmit = async () => {
      bridgeEmitting.add(unique_id);
      try {
        const synapseStorage = synapse.storage.find(unique_id as TSynapseId);
        if (!synapseStorage) return;

        const exported = synapseStorage.export() as Record<string, unknown>;

        // Derive state string: prefer is_on (switch/lock style), then state, then unknown
        const rawState =
          exported.is_on !== undefined ? exported.is_on : (exported.state ?? "unknown");
        const state = String(rawState);
        const attributes = (exported.attributes ?? {}) as ENTITY_STATE<ANY_ENTITY>["attributes"];

        // Ensure entity is seeded in mock_assistant before emitting
        if (!mock_assistant.entity.byId(entity_id as ANY_ENTITY)) {
          mock_assistant.entity.register(entity_id as ANY_ENTITY, {
            attributes,
            entity_id: entity_id as ANY_ENTITY,
            state,
          });
          // Let the registration settle through the socket path
          await Promise.resolve();
        }

        await mock_assistant.entity.emitChange(entity_id as ANY_ENTITY, { attributes, state });
      } catch (err) {
        logger.warn({ err, unique_id }, "bridge emit failed");
      } finally {
        bridgeEmitting.delete(unique_id);
      }
    };

    if (!socketConnected) {
      pendingEmits.push(doEmit);
    } else {
      await doEmit();
    }
  }

  // Patch synapse.storage.add to intercept set calls on each entity's storage
  const originalAdd = synapse.storage.add.bind(synapse.storage);
  synapse.storage.add = function patchedStorageAdd(options) {
    const storage = originalAdd(options);
    const { entity, domain } = options;
    const unique_id = entity.unique_id;
    const suggested_object_id = entity.suggested_object_id ?? entity.unique_id;
    const derived_entity_id = deriveEntityId(domain, suggested_object_id);
    entityIdMap.set(unique_id, derived_entity_id);

    const originalSet = storage.set.bind(storage);
    storage.set = async (key, value) => {
      await originalSet(key, value);
      // F6: skip bridge emit if we are already emitting for this entity
      if (!bridgeEmitting.has(unique_id)) {
        await bridgeEmit(unique_id);
      }
    };

    return storage;
  };

  // Seed mock_assistant with synapse entities after bootstrap (when storage is initialized)
  lifecycle.onBootstrap(async () => {
    // Allow synapse's own onBootstrap handlers (loadData) to complete first
    // Use microtask yield instead of setImmediate for fake-timer compatibility
    await Promise.resolve();

    for (const [unique_id] of entityIdMap) {
      const entity_id = entityIdMap.get(unique_id);
      if (!entity_id) continue;

      const synapseStorage = synapse.storage.find(unique_id as TSynapseId);
      if (!synapseStorage) continue;

      const exported = synapseStorage.export() as Record<string, unknown>;
      const rawState =
        exported.is_on !== undefined ? exported.is_on : (exported.state ?? "unknown");
      const state = String(rawState);
      const attributes = (exported.attributes ?? {}) as ENTITY_STATE<ANY_ENTITY>["attributes"];

      if (!mock_assistant.entity.byId(entity_id as ANY_ENTITY)) {
        mock_assistant.entity.register(entity_id as ANY_ENTITY, {
          attributes,
          entity_id: entity_id as ANY_ENTITY,
          state,
        });
      }
    }
  });

  return {
    bridgeEmit,
    /** Derive the hass entity_id for a synapse entity by its unique_id. */
    getEntityId(unique_id: string): string {
      return entityIdMap.get(unique_id) ?? "";
    },
  };
}
