import { is, SINGLE, START, TAnyFunction, TServiceParams } from "@digital-alchemy/core";
import { ANY_ENTITY, ENTITY_STATE, TUniqueId, TUniqueIDMapping } from "@digital-alchemy/hass";

import {
  AddEntityOptions,
  BaseEvent,
  CreateRemovableCallback,
  DomainGeneratorOptions,
  EntityConfigCommon,
  formatObjectId,
  generateHash,
  RemovableCallback,
  SynapseEntityProxy,
  TEventMap,
} from "../helpers";

export function DomainGenerator({
  logger,
  internal,
  synapse,
  event,
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
  }: DomainGeneratorOptions<CONFIGURATION, EVENT_MAP>) {
    logger.trace({ bus_events, context }, "registering domain [%s]", domain);

    // 🚌🚏 Bus transfer
    bus_events.forEach(name => {
      // some domains duplicate others
      if (registered.has(name)) {
        return;
      }
      logger.trace({ name }, "set up bus transfer");
      registered.add(name);
      hass.socket.onEvent({
        context,
        event: [config.synapse.EVENT_NAMESPACE, name, getIdentifier()].join("/"),
        exec: ({ data }: BaseEvent) => {
          logger.trace({ data, name }, `receive`);
          event.emit(`/synapse/${name}/${data.unique_id}`, data);
        },
      });
    });

    return {
      // #MARK: add_entity
      addEntity<ATTRIBUTES extends object, LOCALS extends object>(
        entity: AddEntityOptions<CONFIGURATION, EVENT_MAP, ATTRIBUTES, LOCALS>,
      ) {
        // * defaults
        // - unique_id - required for comms
        entity.unique_id = is.empty(entity.unique_id)
          ? generateHash(`${getIdentifier()}:${entity.suggested_object_id || entity.name}`)
          : entity.unique_id;
        // - suggested_object_id - required on python side due to the way the code is set up
        entity.suggested_object_id ??= formatObjectId(entity.name);
        const unique_id = entity.unique_id as TUniqueId;

        // * initialize storage
        const storage = synapse.storage.add<
          LOCALS,
          ATTRIBUTES,
          CONFIGURATION & EntityConfigCommon<ATTRIBUTES, LOCALS>
        >({
          domain,
          entity,
          load_config_keys,
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

        const getEntity = () => hass.refBy.unique_id(unique_id);

        // #MARK: entity proxy
        return new Proxy({} as SynapseEntityProxy<CONFIGURATION, EVENT_MAP, ATTRIBUTES, LOCALS>, {
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
                type ENTITY_ID = Extract<TUniqueIDMapping[typeof unique_id], ANY_ENTITY>;
                return function (callback: TAnyFunction) {
                  const removableCallback = async (
                    a: ENTITY_STATE<ENTITY_ID>,
                    b: ENTITY_STATE<ENTITY_ID>,
                  ) => await internal.safeExec(async () => callback(a, b, remove));
                  function remove() {
                    event.removeListener(unique_id, removableCallback);
                  }
                  event.on(unique_id, removableCallback);
                  return { remove };
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
