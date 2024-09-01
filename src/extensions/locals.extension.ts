import { TServiceParams } from "@digital-alchemy/core";

import {
  ENTITY_LOCALS_UPSERT,
  HomeAssistantEntityLocalRow,
  HomeAssistantEntityRow,
  SELECT_LOCALS_QUERY,
  TSynapseId,
} from "../helpers";

export function SynapseLocals({ synapse, logger }: TServiceParams) {
  // #MARK: updateLocal
  function updateLocal(unique_id: TSynapseId, key: string, content: unknown) {
    const database = synapse.sqlite.getDatabase();
    const entity = database
      .prepare(`SELECT id FROM HomeAssistantEntity WHERE unique_id = ?`)
      .get(unique_id) as HomeAssistantEntityRow;

    if (!entity) {
      logger.warn({ name: updateLocal, unique_id }, `Entity with unique_id not found`);
      return;
    }

    const entity_id = entity.id;
    const value_json = JSON.stringify(content);
    const now = new Date().toISOString();

    const insertLocal = database.prepare(ENTITY_LOCALS_UPSERT);
    insertLocal.run({
      entity_id,
      key,
      last_modified: now,
      value_json,
    });
  }

  // #MARK: loadLocals
  function loadLocals(unique_id: TSynapseId) {
    logger.trace({ unique_id }, "initial load of locals");
    const database = synapse.sqlite.getDatabase();

    const locals = database
      .prepare<[TSynapseId], HomeAssistantEntityLocalRow>(SELECT_LOCALS_QUERY)
      .all(unique_id);

    return new Map<string, unknown>(locals.map(i => [i.key, JSON.parse(i.value_json)]));
  }

  // #MARK: localsProxy
  function localsProxy<LOCALS extends object>(unique_id: TSynapseId, defaults: LOCALS) {
    logger.trace("locals");
    let locals: Map<string, unknown>;

    return new Proxy({ ...defaults } as LOCALS, {
      get(_, property: string) {
        locals ??= loadLocals(unique_id);
        if (locals.has(property)) {
          return locals.get(property);
        }
        return defaults[property as keyof LOCALS];
      },
      set(_, property: string, value) {
        locals ??= loadLocals(unique_id);
        locals.set(property, value);
        updateLocal(unique_id, property, value);
        return true;
      },
    });
  }

  return { localsProxy };
}
