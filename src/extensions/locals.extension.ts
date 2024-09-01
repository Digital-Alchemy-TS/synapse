import { is, TServiceParams } from "@digital-alchemy/core";

import {
  DELETE_LOCALS_BY_UNIQUE_ID_QUERY,
  DELETE_LOCALS_QUERY,
  ENTITY_LOCALS_UPSERT,
  HomeAssistantEntityLocalRow,
  SELECT_LOCALS_QUERY,
  TSynapseId,
} from "../helpers";

export function SynapseLocals({ synapse, logger }: TServiceParams) {
  // #MARK: updateLocal
  function updateLocal(unique_id: TSynapseId, key: string, content: unknown) {
    const database = synapse.sqlite.getDatabase();

    const value_json = JSON.stringify(content);
    const last_modified = new Date().toISOString();
    const metadata_json = JSON.stringify({});

    database.prepare(ENTITY_LOCALS_UPSERT).run({
      key,
      last_modified,
      metadata_json,
      unique_id,
      value_json,
    });
  }

  // #MARK: loadLocals
  /**
   * locals are only loaded when they are first utilized for a particular entity
   *
   * allows for more performant cold boots
   */
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
    logger.trace({ unique_id }, "building locals proxy");
    let locals: Map<string, unknown>;

    return {
      proxy: new Proxy({ ...defaults } as LOCALS, {
        // * delete entity.locals.thing
        deleteProperty(_, key: string) {
          locals ??= loadLocals(unique_id);
          const database = synapse.sqlite.getDatabase();
          database.prepare(DELETE_LOCALS_QUERY).run({ key, unique_id });
          locals.delete(key);
          return true;
        },
        get(_, property: string) {
          locals ??= loadLocals(unique_id);
          if (locals.has(property)) {
            return locals.get(property);
          }
          logger.trace({ unique_id }, `using code default for [%s]`, property);
          return defaults[property as keyof LOCALS];
        },
        // * "thing" in entity.locals
        has(_, property: string) {
          locals ??= loadLocals(unique_id);
          return locals.has(property) || property in defaults;
        },
        // * Object.keys(entity.locals)
        ownKeys() {
          locals ??= loadLocals(unique_id);
          return is.unique([...Object.keys(defaults), ...locals.keys()]);
        },
        set(_, property: string, value) {
          locals ??= loadLocals(unique_id);
          if (locals.get(property) === value) {
            logger.trace({ property, unique_id }, `value didn't change, not saving`);
            return true;
          }
          logger.debug({ unique_id }, `updating [%s]`, property);
          updateLocal(unique_id, property, value);
          locals.set(property, value);
          return true;
        },
      }),
      // * delete entity.locals
      reset: () => {
        logger.warn({ unique_id }, "reset locals");
        const database = synapse.sqlite.getDatabase();
        database.prepare(DELETE_LOCALS_BY_UNIQUE_ID_QUERY).run({ unique_id });
        locals = new Map();
      },
    };
  }

  return { localsProxy };
}
