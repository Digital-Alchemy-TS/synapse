import { is, TBlackHole, TServiceParams } from "@digital-alchemy/core";
import { PICK_ENTITY, TEntityUpdateCallback } from "@digital-alchemy/hass";
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
  TEventMap,
} from "../helpers";

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

    bus_events.forEach(name =>
      hass.socket.onEvent({
        context,
        event: [config.synapse.EVENT_NAMESPACE, name, getIdentifier()].join("/"),
        // 🚌🚏 Bus transfer
        exec: ({ data }: BaseEvent) => event.emit(`/synapse/${name}/${data.unique_id}`, data),
      }),
    );

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
        const storage = synapse.state.add({
          entity,
          load_config_keys,
          map_config: map_config as (keyof EntityConfigCommon<object>)[],
          map_state: map_state as keyof EntityConfigCommon<object>,
        });

        // * map bus events
        bus_events.forEach(bus_event => {
          if (is.undefined(entity[bus_event])) {
            return;
          }
          logger.trace({ bus_event, context, name: entity.name }, `static attach`);
          removableListener(`synapse/${bus_event}/${unique_id}`, entity[bus_event]);
        });

        // * build dynamic listeners
        const dynamicAttach = Object.fromEntries(
          bus_events.map(name => [
            name,
            ((callback: RemovableCallback) =>
              removableListener(name, callback)) as CreateRemovableCallback,
          ]),
        );

        const getEntity = () => hass.entity.byUniqueId(unique_id);

        // * final return
        return {
          /**
           * Look up entity proxy in hass entity registry
           *
           * > **⚠️ REGISTRY NOT POPULATED BEFORE `onReady`**
           */
          getEntity,

          /**
           * Look up entity in `hass` entity registry, and pass through the `onUpdate` request
           *
           * Usable at any lifecycle stage
           */
          onUpdate() {
            return (callback: TEntityUpdateCallback<PICK_ENTITY>) => {
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
          },

          /**
           * internal storage
           */
          storage,

          // - ... and all the callback events
          ...(dynamicAttach as BuildCallbacks<EVENT_MAP>),
        };
      },
    };
  }
  return { create };
}

type BuildCallbacks<EVENT_MAP extends TEventMap> = {
  [EVENT_NAME in Extract<
    keyof EVENT_MAP,
    string
  > as CamelCase<`on-${EVENT_NAME}`>]: CreateRemovableCallback<EVENT_MAP[EVENT_NAME]>;
};
