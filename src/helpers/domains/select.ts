import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseSelectParams = BaseEntityParams<string> &
  SelectConfiguration & {
    select_option?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

type SetValueData = { value: string };

export type SelectConfiguration = EntityConfigCommon & {
  /**
   * The current select option
   */
  current_option?: string;
  /**
   * A list of available options as strings
   */
  options?: string[];
};

export type SynapseVirtualSelect = BaseVirtualEntity<
  string,
  object,
  SelectConfiguration
> & { onSelectOption: CreateRemovableCallback<SetValueData> };
