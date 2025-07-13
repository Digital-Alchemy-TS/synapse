import { TServiceParams } from "@digital-alchemy/core";

export function SynapseLocalsService({ synapse, logger, internal, event }: TServiceParams) {
  const { is } = internal.utils;

  // #MARK: updateLocal
  async function updateLocal(unique_id: string, key: string, content: unknown) {
    logger.trace({ key, unique_id }, "updateLocal");

    if (is.undefined(content)) {
      logger.debug({ key, unique_id }, `delete local (value {undefined})`);
      await synapse.sqlite.deleteLocal(unique_id, key);
      return;
    }

    logger.trace({ key, unique_id }, "update local");
    await synapse.sqlite.updateLocal(unique_id, key, content);
  }

  // #MARK: loadLocals
  /**
   * locals are only loaded when they are first utilized for a particular entity
   *
   * allows for more performant cold boots
   */
  async function loadLocals(unique_id: string) {
    if (!internal.boot.completedLifecycleEvents.has("PostConfig")) {
      logger.warn("cannot load locals before [PostConfig]");
      return undefined;
    }
    logger.trace({ unique_id }, "initial load of locals");
    return await synapse.sqlite.loadLocals(unique_id);
  }

  // #MARK: deleteLocal
  async function deleteLocal(unique_id: string, key: string) {
    logger.debug({ key, unique_id }, `delete local (value undefined)`);
    await synapse.sqlite.deleteLocal(unique_id, key);
  }

  // #MARK: deleteLocalsByUniqueId
  async function deleteLocalsByUniqueId(unique_id: string) {
    logger.debug({ unique_id }, "delete all locals");
    await synapse.sqlite.deleteLocalsByUniqueId(unique_id);
  }

  return {
    deleteLocal,
    deleteLocalsByUniqueId,
    loadLocals,
    updateLocal,
  };
}
