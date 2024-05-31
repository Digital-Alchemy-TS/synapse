import {
  BaseEntityParams,
  BaseVirtualEntity,
  CreateRemovableCallback,
  RemovableCallback,
} from "../base-domain.helper";
import { EntityConfigCommon } from "../common-config.helper";

export type SynapseTextParams = BaseEntityParams<string> &
  TextConfiguration & {
    set_value?: RemovableCallback<SetValueData>;
    /**
     * default: true
     */
    managed?: boolean;
  };

type SetValueData = { value: string };

export type TextConfiguration = EntityConfigCommon & {
  /**
   * Defines how the text should be displayed in the UI. Can be text or password.
   */
  mode?: "text" | "password";
  /**
   * The maximum number of characters in the text value (inclusive).
   */
  native_max?: number;
  /**
   * The minimum number of characters in the text value (inclusive).
   */
  native_min?: number;
  /**
   * A regex pattern that the text value must match to be valid.
   */
  pattern?: string;
  /**
   * The value of the text.
   */
  native_value?: string;
};

export type SynapseVirtualText = BaseVirtualEntity<string, object, TextConfiguration> & {
  onSetValue: CreateRemovableCallback<SetValueData>;
};
