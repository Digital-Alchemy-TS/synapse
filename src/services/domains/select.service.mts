import type { TServiceParams } from "@digital-alchemy/core";
import type { ByIdProxy, PICK_ENTITY } from "@digital-alchemy/hass";

import type {
  AddEntityOptions,
  BasicAddParams,
  CallbackData,
  SettableConfiguration,
  SynapseEntityProxy,
} from "../../helpers/index.mts";

export type SelectConfiguration<DATA extends object, OPTIONS extends string = string> = {
  /**
   * The current select option
   */
  current_option?: SettableConfiguration<OPTIONS, DATA>;
  /**
   * A list of available options as strings
   */
  options?: OPTIONS[];
  /**
   * default: true
   */
  managed?: boolean;
};

type SelectOptions<OPTIONS extends string> = BasicAddParams & { options: OPTIONS };

export type SelectEvents<OPTIONS extends string = string> = {
  select_option: { option: OPTIONS };
};

/**
 * Convenient type for select entities with optional attributes and locals
 */
export type SynapseSelect<
  OPTIONS extends string,
  ATTRIBUTES extends object = {},
  LOCALS extends object = {},
  DATA extends object = {},
> = SynapseEntityProxy<
  SelectConfiguration<DATA, OPTIONS>,
  SelectEvents<OPTIONS>,
  ATTRIBUTES,
  LOCALS,
  DATA,
  PICK_ENTITY<"select">
> & {
  entity: ByIdProxy<PICK_ENTITY<"select">>;
};

export function VirtualSelect({ context, synapse, logger }: TServiceParams) {
  const generate = synapse.generator.create<SelectConfiguration<object>, SelectEvents>({
    bus_events: ["select_option"],
    context,
    domain: "select",
    load_config_keys: ["current_option", "options"],
  });

  return function <
    OPTIONS extends string,
    PARAMS extends SelectOptions<OPTIONS>,
    DATA extends object = CallbackData<
      PARAMS["locals"],
      PARAMS["attributes"],
      SelectConfiguration<object>
    >,
  >({
    managed = true,
    ...options
  }: AddEntityOptions<
    SelectConfiguration<DATA, OPTIONS>,
    SelectEvents<OPTIONS>,
    PARAMS["attributes"],
    PARAMS["locals"],
    DATA
  >) {
    // @ts-expect-error it's fine
    const entity = generate.addEntity<PARAMS["attributes"], PARAMS["locals"], DATA>(options);

    if (managed) {
      entity.onSelectOption(({ option }) => {
        logger.trace({ option }, "[managed] onSelectOption");
        void entity.storage.set("current_option", option);
      });
    }

    return entity as unknown as SynapseSelect<
      OPTIONS,
      PARAMS["attributes"],
      PARAMS["locals"],
      DATA
    >;
  };
}
