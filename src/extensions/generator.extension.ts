import { is, TBlackHole, TContext, TServiceParams } from "@digital-alchemy/core";
import { ENTITY_STATE, PICK_ENTITY, TRawDomains } from "@digital-alchemy/hass";
import { createHash } from "crypto";
import { CamelCase } from "type-fest";

import {
  CreateRemovableCallback,
  EntityConfigCommon,
  RemovableCallback,
  TSynapseId,
} from "../helpers";

export type DomainGeneratorOptions<
  CONFIGURATION extends object,
  EVENT_MAP extends Record<string, object>,
> = {
  /**
   * The domain to map the code to on the python side
   */
  domain: TRawDomains;
  /**
   * Context of the synapse extension generating
   */
  context: TContext;
  /**
   * Handle translation of `entity.state`
   *
   * - map to config property
   * - provide setters & getters to do something custom
   */
  /**
   * Bus Transfer events
   */
  bus_events?: Extract<keyof EVENT_MAP, string>[];
  /**
   * Keys to map from `add_entity` options -> `proxy.configuration`
   */
  load_config_keys?: Extract<keyof CONFIGURATION, string>[];
  /**
   * What to use instead of `undefined` / `None`
   */
  default_config?: Partial<CONFIGURATION>;
};

type TEventMap = Record<string, object>;

type TCallback = (
  new_state: NonNullable<ENTITY_STATE<PICK_ENTITY>>,
  old_state: NonNullable<ENTITY_STATE<PICK_ENTITY>>,
  remove: () => TBlackHole,
) => TBlackHole;

export type AddEntityOptions<
  CONFIGURATION extends object,
  EVENT_MAP extends Record<string, object> = Record<string, object>,
  ATTRIBUTES extends object = object,
> = {
  context: TContext;
} & EntityConfigCommon<ATTRIBUTES> &
  CONFIGURATION &
  Partial<{
    [EVENT in keyof EVENT_MAP]: RemovableCallback<EVENT_MAP[EVENT]>;
  }>;

function generateHash(input: string) {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

type BaseEvent = {
  data: {
    unique_id: TSynapseId;
  };
};

const formatObjectId = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replaceAll(/[^\d_a-z]+/g, "_")
    .replaceAll(/^_+|_+$/g, "")
    .replaceAll(/_+/g, "_");

const LATE_READY = -1;

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

  function create<CONFIGURATION extends object, EVENT_MAP extends TEventMap>({
    domain,
    context,
    bus_events = [],
    load_config_keys = [],
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
      add_entity<ATTRIBUTES extends object>(
        entity: AddEntityOptions<CONFIGURATION, EVENT_MAP, ATTRIBUTES>,
      ) {
        // * defaults
        entity.unique_id = is.empty(entity.unique_id)
          ? generateHash(`${getIdentifier()}:${entity.suggested_object_id || entity.name}`)
          : entity.unique_id;
        entity.suggested_object_id ??= formatObjectId(entity.name);
        const unique_id = entity.unique_id;

        // * initialize storage
        const storage = synapse.state.add({
          //
          entity,
          load_keys: undefined,
          map_config: undefined,
          map_state: undefined,
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
            return (callback: TCallback) => {
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
