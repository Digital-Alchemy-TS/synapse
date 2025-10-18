import type { TServiceParams } from "@digital-alchemy/core";
import { InternalError } from "@digital-alchemy/core";

import { EVENT_SYNAPSE_PULL_DB } from "../index.mts";

export function SynapseLocalsService({
  synapse,
  logger,
  context,
  event,
  lifecycle,
}: TServiceParams) {
  // #MARK: localsProxy
  function localsProxy<LOCALS extends object>(unique_id: string, defaults: LOCALS) {
    let loaded = false;
    let data = { ...defaults } as LOCALS;
    const loadedData = new Map<string, unknown>();

    // Create the proxy for locals
    const proxy = new Proxy(data, {
      deleteProperty(target, property: string) {
        // Remove from target
        (target as Record<string, unknown>)[property] = (defaults as Record<string, unknown>)[
          property
        ];

        // Remove from loaded data
        loadedData.delete(property);

        // Delete from database
        void synapse.database.deleteLocal(unique_id, property);

        return true;
      },

      get(target, property: string) {
        return loadedData.has(property)
          ? loadedData.get(property)
          : (target as Record<string, unknown>)[property];
      },

      has(target, property: string) {
        return loadedData.has(property) || property in target;
      },

      ownKeys(target) {
        const keys = new Set<string>();
        // Add default keys
        Object.keys(target).forEach(key => keys.add(key));
        // Add loaded keys
        loadedData.forEach((_, key) => keys.add(key));
        return Array.from(keys);
      },

      set(target, property: string, value: unknown) {
        // Update the target
        (target as Record<string, unknown>)[property] = value;

        // Store in loaded data
        loadedData.set(property, value);

        // Persist to database
        void synapse.database.updateLocal(unique_id, property, value);

        return true;
      },
    });

    async function loadFromDb() {
      const locals = await synapse.database.loadLocals(unique_id);
      loadedData.clear();
      if (locals) {
        locals.forEach((value, key) => loadedData.set(key, value));
      }
    }

    lifecycle.onBootstrap(async () => {
      await loadFromDb();
      loaded = true;
    });

    async function refresh() {
      if (!loaded) {
        throw new InternalError(
          context,
          "PULL_BEFORE_INIT",
          "Locals for this entity are not loaded",
        );
      }
      logger.info("pulling latest locals values from db");
      await loadFromDb();
    }

    event.on(EVENT_SYNAPSE_PULL_DB, refresh);

    return {
      async destroy() {
        await synapse.database.deleteLocalsByUniqueId(unique_id);
        event.removeListener(EVENT_SYNAPSE_PULL_DB, refresh);
        loaded = false;
      },
      proxy,
      refresh,
      async replace(newValue: LOCALS) {
        loadedData.clear();
        data = { ...newValue } as LOCALS;
        // Clear existing and set new values
        await synapse.database.deleteLocalsByUniqueId(unique_id);
        Object.entries(newValue).forEach(([key, value]) => {
          if (value !== undefined) {
            void synapse.database.updateLocal(unique_id, key, value);
          }
        });
      },
      reset() {
        loadedData.clear();
        data = { ...defaults } as LOCALS;
        void synapse.database.deleteLocalsByUniqueId(unique_id);
      },
    };
  }

  return {
    localsProxy,
  };
}
