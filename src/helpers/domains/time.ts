import { Dayjs } from "dayjs";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseTimeParams = BaseEntityParams<Dayjs> &
  TimeConfiguration & {
    set_value?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

type SetValueData = { value: SynapseTimeFormat };

export type TimeConfiguration = EntityConfigCommon & {
  native_value?: SynapseTimeFormat;
};

export type SynapseTimeFormat = `${number}${number}:${number}${number}:${number}${number}`;

export type SynapseVirtualTime = BaseVirtualEntity<Dayjs, object, TimeConfiguration> & {
  onSetValue: CreateRemovableCallback<SetValueData>;
};
