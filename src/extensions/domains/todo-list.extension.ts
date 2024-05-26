import { is, TServiceParams } from "@digital-alchemy/core";

import {
  RemovableCallback,
  SynapseTodoListParams,
  SynapseVirtualTodoList,
  TodoListConfiguration,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";
import { TRegistry } from "../registry.extension";

export function VirtualTodoList({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualTodoList>({
    context,
    // @ts-expect-error it's fine
    domain: "todo_list",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseTodoListParams) {
    const proxy = new Proxy({} as SynapseVirtualTodoList, {
      // #MARK: get
      // eslint-disable-next-line sonarjs/cognitive-complexity
      get(_, property: keyof SynapseVirtualTodoList) {
        // > common
        // * name
        if (property === "name") {
          return entity.name;
        }
        // * unique_id
        if (property === "unique_id") {
          return unique_id;
        }
        // * onTodoList
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
        // * onCreateTodoItem
        if (property === "onCreateTodoItem") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(INSTALL, callback);
        }
        // * onDeleteTodoItem
        if (property === "onDeleteTodoItem") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(INSTALL, callback);
        }
        // * onMoveTodoItem
        if (property === "onMoveTodoItem") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(INSTALL, callback);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS, "onSetValue"],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<
      STATE,
      ATTRIBUTES,
      TodoListConfiguration
    >({
      load_keys: ["todo_items", "supported_features"],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const INSTALL = synapse.registry.busTransfer({
      context,
      eventName: "install",
      unique_id,
    });

    // - Attach static listener
    if (is.function(entity.create_todo_item)) {
      proxy.onCreateTodoItem(entity.create_todo_item);
    }
    if (is.function(entity.delete_todo_item)) {
      proxy.onDeleteTodoItem(entity.delete_todo_item);
    }
    if (is.function(entity.move_todo_item)) {
      proxy.onMoveTodoItem(entity.move_todo_item);
    }

    // - Done
    return proxy;
  };
}
