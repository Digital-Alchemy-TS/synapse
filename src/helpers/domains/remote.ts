import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseRemoteParams = BaseEntityParams<RemoteStates> &
  RemoteConfiguration & {
    turn_on?: RemovableCallback<{ activity?: string }>;
    turn_off?: RemovableCallback<{ activity?: string }>;
    toggle?: RemovableCallback<{ activity?: string }>;
    send_command?: RemovableCallback<{ command: string[] }>;
    learn_command?: RemovableCallback;
    delete_command?: RemovableCallback;
  };

type RemoteStates = never;

export type RemoteConfiguration = EntityConfigCommon & {
  /**
   * Return the current active activity
   */
  current_activity?: string;
  /**
   * Return the list of available activities
   */
  activity_list?: string[];
  supported_features?: number;
};

export type SynapseVirtualRemote = BaseVirtualEntity<RemoteStates, object, RemoteConfiguration> & {
  onTurnOn?: CreateRemovableCallback<{ activity?: string }>;
  onTurnOff?: CreateRemovableCallback<{ activity?: string }>;
  onToggle?: CreateRemovableCallback<{ activity?: string }>;
  onSendCommand?: CreateRemovableCallback<{ command: string[] }>;
  onLearnCommand?: CreateRemovableCallback;
  onDeleteCommand?: CreateRemovableCallback;
};
