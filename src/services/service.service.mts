import type { TServiceParams } from "@digital-alchemy/core";
import { InternalError } from "@digital-alchemy/core";

import type {
  SynapseServiceCreate,
  SynapseServiceCreateCallback,
  SynapseServiceCreateOptions,
  SynapseServiceListField,
} from "../index.mts";
import { SERVICE_CALL_EVENT } from "../index.mts";

export function ServiceService({
  synapse,
  logger,
  context,
  internal,
  event,
}: TServiceParams): SynapseServiceCreate {
  return function <SCHEMA extends SynapseServiceListField>(
    options: SynapseServiceCreateOptions<SCHEMA>,
    callback: SynapseServiceCreateCallback,
  ) {
    const { SERVICE_REGISTRY } = synapse.socket;
    const alreadyExists = SERVICE_REGISTRY.has(options.name);
    if (alreadyExists) {
      throw new InternalError(
        context,
        "SERVICE_ALREADY_EXISTS",
        `The service ${options.name} has already been registered`,
      );
    }
    SERVICE_REGISTRY.set(options.name, {
      context: options.context,
      schema: {
        ...options.schema,
        name: options.name,
      },
    });

    setImmediate(() => void synapse.socket.hashUpdateEvent());
    const eventName = SERVICE_CALL_EVENT(options.name);
    logger.error({ eventName, name: options.name }, `registering service call listener`);
    const cb = async (data: Record<string, unknown>) => {
      logger.warn({ data }, "HIT");
      await callback(data);
    };
    event.on(eventName, cb);

    return internal.removeFn(() => {
      logger.info({ name: options.name }, `cleaning up service handler`);
      event.removeListener(eventName, cb);
    });
  };
}
