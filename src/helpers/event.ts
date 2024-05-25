import { TBlackHole } from "@digital-alchemy/core";
import { ENTITY_STATE, PICK_ENTITY } from "@digital-alchemy/hass";

import { RemoveReturn } from "./domains";

export type UpdateCallback<ENTITY_ID extends PICK_ENTITY> = (
  callback: (
    new_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    old_state: NonNullable<ENTITY_STATE<ENTITY_ID>>,
    remove: () => TBlackHole,
  ) => TBlackHole,
) => RemoveReturn;
