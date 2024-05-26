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
  uid?: string;
  summary?: string;
  due?: Dayjs;
  status?: "needs_action" | "complete";
  description?: string;
};

export type TodoListConfiguration = EntityConfigCommon & {
  todo_items: TodoItem[];
  supported_features?: number;
};

export type SynapseVirtualTodoList = BaseVirtualEntity<
  never,
  object,
  TodoListConfiguration
> & {
  onCreateTodoItem?: CreateRemovableCallback<{ item: TodoItem }>;
  onDeleteTodoItem?: CreateRemovableCallback<{ item: TodoItem }>;
  onMoveTodoItem?: CreateRemovableCallback<{ item: TodoItem }>;
};
