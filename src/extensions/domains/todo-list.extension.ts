import { TServiceParams } from "@digital-alchemy/core";
import { Dayjs } from "dayjs";

import { AddEntityOptions } from "../..";

export type TodoItem = {
  /**
   * A unique identifier for the to-do item. This field is required for updates and the entity state.
   */
  uid?: string;
  /**
   * A title or summary of the to-do item. This field is required for the entity state.
   */
  summary?: string;
  /**
   * The date and time that a to-do is expected to be completed.
   * The types supported depend on TodoListEntityFeature.DUE_DATE or TodoListEntityFeature.DUE_DATETIME or both being set.
   * As a datetime, must have a timezone.
   */
  due?: Dayjs;
  /**
   * Defines the overall status for the to-do item, either NEEDS_ACTION or COMPLETE. This field is required for the entity state.
   */
  status?: "needs_action" | "complete";
  /**
   * A more complete description of the to-do item than that provided by the summary.
   * Only supported when TodoListEntityFeature.DESCRIPTION is set.
   */
  description?: string;
};

export type TodoConfiguration = {
  /**
   * Required. The ordered contents of the To-do list.
   */
  todo_items: TodoItem[];
  supported_features?: number;
};

export type TodoEvents = {
  create_todo_item: { item: TodoItem };
  delete_todo_item: { item: TodoItem };
  move_todo_item: { item: TodoItem };
};

export function VirtualTodoList({ context, synapse }: TServiceParams) {
  const generate = synapse.generator.create<TodoConfiguration, TodoEvents>({
    bus_events: ["create_todo_item", "delete_todo_item", "move_todo_item"],
    context,
    // @ts-expect-error its fine
    domain: "todo_list",
    load_config_keys: ["todo_items", "supported_features"],
  });

  return <ATTRIBUTES extends object>(
    options: AddEntityOptions<TodoConfiguration, TodoEvents, ATTRIBUTES>,
  ) => generate.add_entity(options);
}
