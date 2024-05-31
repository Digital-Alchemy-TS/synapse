import { Dayjs } from "dayjs";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseTodoListParams = BaseEntityParams<never> &
  TodoListConfiguration & {
    create_todo_item?: RemovableCallback<{ item: TodoItem }>;
    delete_todo_item?: RemovableCallback<{ item: TodoItem }>;
    move_todo_item?: RemovableCallback<{ item: TodoItem }>;
  };

type TodoItem = {
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

export type TodoListConfiguration = EntityConfigCommon & {
  /**
   * Required. The ordered contents of the To-do list.
   */
  todo_items: TodoItem[];
  supported_features?: number;
};

export type SynapseVirtualTodoList = BaseVirtualEntity<never, object, TodoListConfiguration> & {
  onCreateTodoItem?: CreateRemovableCallback<{ item: TodoItem }>;
  onDeleteTodoItem?: CreateRemovableCallback<{ item: TodoItem }>;
  onMoveTodoItem?: CreateRemovableCallback<{ item: TodoItem }>;
};
