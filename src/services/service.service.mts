import type { RemoveCallback, TServiceParams } from "@digital-alchemy/core";
import { InternalError } from "@digital-alchemy/core";

import type {
  FieldList,
  ServiceCallData,
  SynapseServiceCreate,
  SynapseServiceCreateCallback,
  SynapseServiceCreateOptions,
} from "../index.mts";

const SERVICE_CALL_EVENT = (event_name: string) => `synapse/service_call/${event_name}`;

export function ServiceService({
  synapse,
  logger,
  context,
  internal,
  lifecycle,
  config,
  event,
  hass,
}: TServiceParams): SynapseServiceCreate {
  /**
   * Common handler for all inbound 'synapse/service_call' socket messages.
   * Routes incoming service call messages to registered service callbacks.
   */
  hass.socket.registerMessageHandler<ServiceCallData>(
    "synapse/service_call",
    async ({ service_data, service_name }) => {
      const evt = SERVICE_CALL_EVENT(service_name);
      logger.trace({ evt, name: service_name, service_data }, `received service call`);
      event.emit(evt, service_data);
    },
  );

  return function <SCHEMA extends FieldList>(
    options: SynapseServiceCreateOptions<SCHEMA>,
    callback: SynapseServiceCreateCallback,
  ) {
    const remove = new Set<RemoveCallback>();

    lifecycle.onPostConfig(() => {
      const { SERVICE_REGISTRY } = synapse.socket;
      const alreadyExists = SERVICE_REGISTRY.has(options.name);
      if (alreadyExists) {
        throw new InternalError(
          context,
          "SERVICE_ALREADY_EXISTS",
          `The service ${options.name} has already been registered`,
        );
      }
      options.unique_id ??= [
        config.synapse.METADATA_UNIQUE_ID,
        config.synapse.DEFAULT_SERVICE_DOMAIN,
        options.name,
      ].join("-");
      options.domain ??= config.synapse.DEFAULT_SERVICE_DOMAIN;
      SERVICE_REGISTRY.set(options.name, options);

      const eventName = SERVICE_CALL_EVENT(options.name);
      logger.trace({ eventName, name: options.name }, `registering service call listener`);
      event.on(eventName, callback);
      remove.add(
        internal.removeFn(() => {
          logger.debug({ eventName, name: options.name }, "removing event handle");
          event.removeListener(eventName, callback);
        }),
      );
    });

    return internal.removeFn(() => {
      logger.info({ name: options.name }, `cleaning up service handler`);
      remove.forEach(i => {
        i();
        remove.delete(i);
      });
    });
  };
}
