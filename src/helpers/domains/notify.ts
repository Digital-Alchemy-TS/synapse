import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseNotifyParams = BaseEntityParams<never> & NotifyConfiguration;

export type NotifyConfiguration = EntityConfigCommon & {
  send_message?: RemovableCallback<MessageData>;
};

type MessageData = {
  message: string;
  title?: string;
};

export type SynapseVirtualNotify = BaseVirtualEntity<
  never,
  object,
  NotifyConfiguration
> & { onSendMessage: CreateRemovableCallback<MessageData> };
