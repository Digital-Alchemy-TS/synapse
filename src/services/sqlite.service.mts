import { is, TServiceParams } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";
import SQLiteDriver, { Database } from "better-sqlite3";
import { and, eq } from "drizzle-orm";

import { HomeAssistantEntityRow, TSynapseId } from "../helpers/index.mts";
import { synapse_entity } from "../models/entity.mts";
import { synapse_entity_locals } from "../models/entity-local.mts";

export type SynapseSqliteDriver = typeof SQLiteDriver;

type SynapseSqlite = {
  load: (unique_id: TSynapseId, defaults: object) => Promise<HomeAssistantEntityRow>;
  update: (unique_id: TSynapseId, content: object, defaults?: object) => Promise<void>;
};

const isBun = !is.empty(process.versions.bun);

export function prefix(data: object) {
  return isBun
    ? Object.fromEntries(Object.entries(data).map(([key, value]) => [`$${key}`, value]))
    : data;
}

const bunRewrite = <T extends object>(data: T) =>
  Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => !is.undefined(value))
      .map(([key, value]) => [key, is.object(value) && "current" in value ? "dynamic" : value]),
  ) as T;

export async function SQLiteService({
  logger,
  hass,
  internal,
  synapse,
}: TServiceParams): Promise<SynapseSqlite> {
  const application_name = internal.boot.application.name;
  const registeredDefaults = new Map<string, object>();

  // #MARK: update
  async function update(unique_id: TSynapseId, content: object, defaults?: object) {
    const entity_id = hass.entity.registry.current.find(i => i.unique_id === unique_id)?.entity_id;
    if (is.empty(entity_id)) {
      if (synapse.configure.isRegistered()) {
        logger.warn(
          { name: update, unique_id },
          `app registered, but entity does not exist (reload?)`,
        );
        return;
      }
      logger.warn("app not registered, skipping write");
      return;
    }
    const state_json = JSON.stringify(content);
    const now = new Date().toISOString();
    defaults ??= registeredDefaults.get(unique_id);

    const data = {
      application_name: application_name,
      base_state: JSON.stringify(defaults),
      entity_id: entity_id,
      entity_json: state_json,
      first_observed: now,
      last_modified: now,
      last_reported: now,
      unique_id: unique_id,
    };
    logger.trace({ ...data }, "update entity");
    await synapse.drizzle.db.insert(synapse_entity).values(data);
  }

  // #MARK: loadRow
  async function loadRow<LOCALS extends object = object>(
    unique_id: TSynapseId,
  ): Promise<HomeAssistantEntityRow<LOCALS>> {
    logger.trace({ unique_id }, "load entity");
    const results = await synapse.drizzle.db
      .select()
      .from(synapse_entity)
      .where(
        and(
          eq(synapse_entity.unique_id, unique_id),
          eq(synapse_entity.application_name, application_name),
        ),
      );

    if (is.empty(results)) {
      logger.debug("entity not found in database");
      return undefined;
    }
    const [row] = results;
    const locals = await synapse.drizzle.db
      .select()
      .from(synapse_entity_locals)
      .where(eq(synapse_entity_locals.unique_id, unique_id));
    logger.trace({ entity_id: row.entity_id, locals, unique_id }, "load entity");

    return {
      ...row,
      entity_id: row.entity_id as PICK_ENTITY,
      locals: Object.fromEntries(
        locals.map(i => [i.key, JSON.parse(i.value_json as string)]),
      ) as LOCALS,
    };
  }

  /**
   * remove properties that were defaulted to undefined by internal workflows
   */
  function loadBaseState(base: string): object {
    const current = JSON.parse(base);
    return Object.fromEntries(
      Object.keys(current)
        .filter(key => !is.undefined(current[key]))
        .map(key => [key, current[key]]),
    );
  }

  // #MARK: load
  async function load<LOCALS extends object = object>(
    unique_id: TSynapseId,
    defaults: object,
  ): Promise<HomeAssistantEntityRow<LOCALS>> {
    // - if exists, return existing data
    const data = await loadRow<LOCALS>(unique_id);
    const cleaned = bunRewrite(defaults);
    registeredDefaults.set(unique_id, cleaned);
    if (data) {
      const current = loadBaseState(data.base_state);
      if (is.equal(cleaned, current)) {
        logger.trace({ unique_id }, "equal defaults");
        return data;
      }
      logger.debug(
        { cleaned, current, unique_id },
        "hard config change detected, resetting entity",
      );
      // might do some smart merge logic later 🤷‍♀️
      // technically no specific action is needed here since the below will override
    }
    // - if new: insert then try again
    logger.trace({ name: load, unique_id }, `creating new sqlite entry`);
    await update(unique_id, cleaned, cleaned);
    return loadRow<LOCALS>(unique_id);
  }

  return {
    load,
    update,
  };
}
