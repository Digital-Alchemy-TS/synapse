import { TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
  SwitchConfiguration,
  SwitchValue,
  SynapseSwitchParams,
  SynapseVirtualSwitch,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

export function VirtualSwitch({ context, synapse, logger }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualSwitch>({
    context,
    domain: "switch",
  });

  return function <
    STATE extends SwitchValue = SwitchValue,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends SwitchConfiguration = SwitchConfiguration,
  >(entity: SynapseSwitchParams) {
    // - Define the proxy
    const proxy = new Proxy({} as SynapseVirtualSwitch, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualSwitch) {
        // > common
        // * name
        if (property === "name") {
          return entity.name;
        }
        // * unique_id
        if (property === "unique_id") {
          return unique_id;
        }
        // * onUpdate
        if (property === "onUpdate") {
          return loader.onUpdate();
        }
        // * _rawConfiguration
        if (property === "_rawConfiguration") {
          return loader.configuration;
        }
        // * _rawAttributes
        if (property === "_rawAttributes") {
          return loader.attributes;
        }
        // * attributes
        if (property === "attributes") {
          return loader.attributesProxy();
        }
        // * configuration
        if (property === "configuration") {
          return loader.configurationProxy();
        }
        // * state
        if (property === "state") {
          return loader.state;
        }
        // > domain specific
        // * is_on
        if (property === "is_on") {
          return loader.state === "on";
        }
        // * onToggle
        if (property === "onToggle") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TOGGLE, callback);
        }
        // * onTurnOff
        if (property === "onTurnOff") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_OFF, callback);
        }
        // * onTurnOn
        if (property === "onTurnOn") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TURN_ON, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "is_on",
        "onTurnOn",
        "onTurnOff",
        "onToggle",
      ],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // > domain specific
        // * is_on
        if (property === "is_on") {
          const new_state = ((value as boolean) ? "on" : "off") as STATE;
          loader.setState(new_state);
          return true;
        }
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      load_keys: ["device_class"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const [TURN_OFF, TOGGLE, TURN_ON] = synapse.registry.busTransfer({
      context,
      eventName: ["turn_off", "toggle", "turn_on"],
      unique_id,
    });

    // - Attach static listener
    if (entity.managed !== false) {
      logger.debug(
        { context: entity.context, name: entity.name },
        `setting up state management`,
      );
      proxy.onToggle(() => (proxy.is_on = !proxy.is_on));
      proxy.onTurnOn(() => (proxy.is_on = true));
      proxy.onTurnOff(() => (proxy.is_on = false));
    }

    // - Done
    return proxy;
  };
}
