import { TServiceParams } from "@digital-alchemy/core";

import {
  AlarmControlPanelConfiguration,
  SynapseAlarmControlPanelParams,
  SynapseVirtualAlarmControlPanel,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../../helpers";
import { TRegistry } from "../registry.extension";
import { isBaseEntityKeys } from "../storage.extension";

export function VirtualAlarmControlPanel({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualAlarmControlPanel>({
    context,
    // @ts-expect-error it's fine
    domain: "alarm_control_panel",
  });

  // #MARK: create
  return function <
    STATE extends string = string,
    ATTRIBUTES extends object = object,
  >(entity: SynapseAlarmControlPanelParams) {
    const proxy = new Proxy({} as SynapseVirtualAlarmControlPanel, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualAlarmControlPanel) {
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return dynamicAttach(property);
      },

      ownKeys: () => [
        ...VIRTUAL_ENTITY_BASE_KEYS,
        "onArmCustomBypass",
        "onTrigger",
        "onArmVacation",
        "onArmNight",
        "onArmAway",
        "onArmHome",
        "onDisarm",
      ],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
        // * state
        if (property === "state") {
          loader.setState(value as STATE);
          return true;
        }
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<
      STATE,
      ATTRIBUTES,
      AlarmControlPanelConfiguration
    >({
      load_keys: [
        "code_arm_required",
        "code_format",
        "changed_by",
        "supported_features",
      ],
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Attach bus events
    const { dynamicAttach, staticAttach } = synapse.registry.busTransfer({
      context,
      eventName: [
        "alarm_arm_custom_bypass",
        "alarm_trigger",
        "alarm_arm_vacation",
        "alarm_arm_night",
        "alarm_arm_away",
        "alarm_arm_home",
        "alarm_disarm",
      ],
      unique_id,
    });

    // - Attach static listener
    staticAttach(proxy, entity);

    // - Done
    return proxy;
  };
}
