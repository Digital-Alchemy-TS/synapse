import { is, TServiceParams } from "@digital-alchemy/core";

import {
  isBaseEntityKeys,
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
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onCreateTodoItem
        if (property === "onCreateTodoItem") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(CREATE_TODO_ITEM, callback);
        }
        // * onDeleteTodoItem
        if (property === "onDeleteTodoItem") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(DELETE_TODO_ITEM, callback);
        }
        // * onMoveTodoItem
        if (property === "onMoveTodoItem") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(MOVE_TODO_ITEM, callback);
        }
        return undefined;
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onCreateTodoItem",
        "onDeleteTodoItem",
        "onMoveTodoItem",
      ],

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
    const [CREATE_TODO_ITEM, DELETE_TODO_ITEM, MOVE_TODO_ITEM] =
      synapse.registry.busTransfer({
        context,
        eventName: ["create_todo_item", "delete_todo_item", "move_todo_item"],
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
