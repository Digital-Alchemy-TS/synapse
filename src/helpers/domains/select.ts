import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseSelectParams<OPTIONS extends string> = BaseEntityParams<string> &
  SelectConfiguration<OPTIONS> & {
    select_option?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

type SetValueData = { option: string };

export type SelectConfiguration<OPTIONS extends string> = EntityConfigCommon & {
  /**
   * The current select option
   */
  current_option?: string;
  /**
   * A list of available options as strings
   */
  options?: OPTIONS[];
};

export type SynapseVirtualSelect<OPTIONS extends string> = BaseVirtualEntity<
  string,
  object,
  SelectConfiguration<OPTIONS>
> & { onSelectOption: CreateRemovableCallback<SetValueData> };
