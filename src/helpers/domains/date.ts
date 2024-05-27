import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseDateParams = BaseEntityParams<string> &
  DateConfiguration & {
    set_value?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

type SetValueData = { value: string };

export type DateConfiguration = EntityConfigCommon;

export type SynapseVirtualDate = BaseVirtualEntity<
  string,
  object,
  DateConfiguration
> & { onSetValue: CreateRemovableCallback<SetValueData> };
