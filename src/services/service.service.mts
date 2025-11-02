import type { RemoveCallback, TServiceParams } from "@digital-alchemy/core";
import { InternalError } from "@digital-alchemy/core";

import type {
  FieldList,
  SynapseServiceCreate,
  SynapseServiceCreateCallback,
  SynapseServiceCreateOptions,
} from "../index.mts";
import { SERVICE_CALL_EVENT } from "../index.mts";

export function ServiceService({
  synapse,
  logger,
  context,
  internal,
  lifecycle,
  config,
  event,
}: TServiceParams): SynapseServiceCreate {
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
