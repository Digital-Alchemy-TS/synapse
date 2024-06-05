import { is, SINGLE, START, TBlackHole, TServiceParams } from "@digital-alchemy/core";
import { ByIdProxy, PICK_ENTITY, TEntityUpdateCallback } from "@digital-alchemy/hass";
import { CamelCase } from "type-fest";

import {
  AddEntityOptions,
  BaseEvent,
  CreateRemovableCallback,
  DomainGeneratorOptions,
  EntityConfigCommon,
  formatObjectId,
  generateHash,
  LATE_READY,
  RemovableCallback,
  SettableConfiguration,
  TEventMap,
} from "../helpers";
import { ConfigMapper, TSynapseEntityStorage } from "./storage.extension";

type CommonMethods<CONFIGURATION extends object> = {
  getEntity: () => ByIdProxy<PICK_ENTITY>;
  onUpdate(callback: TEntityUpdateCallback<PICK_ENTITY>): {
    remove(): void;
  };
  storage: TSynapseEntityStorage<CONFIGURATION & EntityConfigCommon<object>>;
};

export type SynapseEntityProxy<
  CONFIGURATION extends object,
  EVENT_MAP extends TEventMap,
  ATTRIBUTES extends object,
> = CommonMethods<CONFIGURATION> &
  BuildCallbacks<EVENT_MAP> &
  NonReactive<CONFIGURATION> &
  EntityConfigCommon<ATTRIBUTES>;

type NonReactive<CONFIGURATION extends object> = {
  [KEY in Extract<keyof CONFIGURATION, string>]: CONFIGURATION[KEY] extends SettableConfiguration<
    infer TYPE
  >
    ? TYPE
    : CONFIGURATION[KEY];
};

type BuildCallbacks<EVENT_MAP extends TEventMap> = {
  [EVENT_NAME in Extract<
    keyof EVENT_MAP,
    string
  > as CamelCase<`on-${EVENT_NAME}`>]: CreateRemovableCallback<EVENT_MAP[EVENT_NAME]>;
};

export function DomainGenerator({
  logger,
  internal,
  synapse,
  event,
  lifecycle,
  hass,
  config,
}: TServiceParams) {
  const getIdentifier = () => internal.boot.application.name;

  // #MARK: removableListener
  function removableListener<DATA extends object>(
    eventName: string,
    callback: RemovableCallback<DATA>,
  ) {
    const remove = () => event.removeListener(eventName, exec);
    const exec = async (data: DATA) =>
      await internal.safeExec(async () => await callback(data, remove));
    event.on(eventName, exec);
    return { remove };
  }

  const registered = new Set<string>();

  // #MARK: create
  function create<CONFIGURATION extends object, EVENT_MAP extends TEventMap>({
    domain,
    context,
    bus_events = [],
    load_config_keys = [],
    map_state,
    map_config = [],
  }: DomainGeneratorOptions<CONFIGURATION, EVENT_MAP>) {
    logger.trace({ bus_events, context }, "registering domain [%s]", domain);

    bus_events.forEach(name => {
      // some domains have duplicates
      // filter those out
      if (registered.has(name)) {
        return;
      }
      registered.add(name);
      hass.socket.onEvent({
        context,
        event: [config.synapse.EVENT_NAMESPACE, name, getIdentifier()].join("/"),
        // 🚌🚏 Bus transfer
        exec: ({ data }: BaseEvent) => event.emit(`/synapse/${name}/${data.unique_id}`, data),
      });
    });

    return {
      // #MARK: add_entity
      add_entity<ATTRIBUTES extends object>(
        entity: AddEntityOptions<CONFIGURATION, EVENT_MAP, ATTRIBUTES>,
      ) {
        // * defaults
        // - unique_id - required for comms
        entity.unique_id = is.empty(entity.unique_id)
          ? generateHash(`${getIdentifier()}:${entity.suggested_object_id || entity.name}`)
          : entity.unique_id;
        // - suggested_object_id - required on python side due to the way the code is set up
        entity.suggested_object_id ??= formatObjectId(entity.name);
        const unique_id = entity.unique_id;

        // * initialize storage
        const storage = synapse.storage.add<CONFIGURATION & EntityConfigCommon<object>>({
          domain,
          entity,
          load_config_keys,
          map_config: map_config as ConfigMapper<
            Extract<keyof EntityConfigCommon<object>, string>
          >[],
          map_state: map_state as keyof EntityConfigCommon<object>,
        });

        // * map bus events
        bus_events.forEach(bus_event => {
          if (is.undefined(entity[bus_event])) {
            return;
          }
          logger.trace({ bus_event, context, name: entity.name }, `static attach`);
          removableListener(`/synapse/${bus_event}/${unique_id}`, entity[bus_event]);
        });

        // * build dynamic listeners
        const dynamicAttach = Object.fromEntries(
          bus_events.map(name => [
            `on${name
              .split("_")
              .map(i => i.charAt(START).toUpperCase() + i.slice(SINGLE))
              .join("")}`,
            ((callback: RemovableCallback) =>
              removableListener(
                `/synapse/${name}/${unique_id}`,
                callback,
              )) as CreateRemovableCallback,
          ]),
        );

        const getEntity = () => hass.entity.byUniqueId(unique_id);

        return new Proxy({} as SynapseEntityProxy<CONFIGURATION, EVENT_MAP, ATTRIBUTES>, {
          get(_, property: string) {
            if (!is.undefined(dynamicAttach[property])) {
              return dynamicAttach[property];
            }
            if (storage.isStored(property)) {
              return storage.get(property);
            }
            switch (property) {
              case "getEntity": {
                return getEntity;
              }
              case "storage": {
                return storage;
              }
              case "onUpdate": {
                return function (callback: TEntityUpdateCallback<PICK_ENTITY>) {
                  let remover: { remove: () => TBlackHole };
                  lifecycle.onReady(() => {
                    const entity = getEntity();
                    if (!entity) {
                      logger.error(
                        { entity, name: "onUpdate" },
                        `event attachment failed, is entity loaded in home assistant?`,
                      );
                      return;
                    }
                    remover = entity.onUpdate(callback);
                  }, LATE_READY);
                  return {
                    /**
                     * can only be used during runtime
                     */
                    remove() {
                      if (remover) {
                        logger.trace(`removing entity update callback`);
                        remover.remove();
                        remover = undefined;
                        return;
                      }
                      // too soon / already used
                      logger.error(`no remover function defined`);
                    },
                  };
                };
              }
            }
            return undefined;
          },
          set(_, property: string, newValue) {
            if (storage.isStored(property)) {
              storage.set(property, newValue);
              return true;
            }
            return false;
          },
        });
      },
    };
  }
  return { create };
}
