import { Dayjs } from "dayjs";

import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseDateParams = BaseEntityParams<Dayjs> &
  DateConfiguration & {
    set_value?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

type SetValueData = { value: SynapseDateFormat };

export type DateConfiguration = EntityConfigCommon & {
  /**
   * `YYYY-MM-DD` string
   */
  native_value?: SynapseDateFormat;
};
type Year = `${number}${number}${number}${number}`;
type MD = `${number}${number}`;
/**
 * YYYY-MM-DD
 */
export type SynapseDateFormat = `${Year}-${MD}-${MD}`;

export type SynapseVirtualDate = BaseVirtualEntity<Dayjs, object, DateConfiguration> & {
  onSetValue: CreateRemovableCallback<SetValueData>;
};
