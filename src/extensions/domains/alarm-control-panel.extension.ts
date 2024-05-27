import { is, TServiceParams } from "@digital-alchemy/core";

import {
  AlarmControlPanelConfiguration,
  RemovableCallback,
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
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        // > domain specific
        // * onArmCustomBypass
        if (property === "onArmCustomBypass") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(ARM_CUSTOM_BYPASS, callback);
        }
        // * onTrigger
        if (property === "onTrigger") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(TRIGGER, callback);
        }
        // * onArmVacation
        if (property === "onArmVacation") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(ARM_VACATION, callback);
        }
        // * onArmNight
        if (property === "onArmNight") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(ARM_NIGHT, callback);
        }
        // * onArmAway
        if (property === "onArmAway") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(ARM_AWAY, callback);
        }
        // * onArmHome
        if (property === "onArmHome") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(ARM_HOME, callback);
        }
        // * onDisarm
        if (property === "onDisarm") {
          return (callback: RemovableCallback) =>
            synapse.registry.removableListener(DISARM, callback);
        }
        return undefined;
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
    const [
      ARM_CUSTOM_BYPASS,
      TRIGGER,
      ARM_VACATION,
      ARM_NIGHT,
      ARM_AWAY,
      ARM_HOME,
      DISARM,
    ] = synapse.registry.busTransfer({
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
    if (is.function(entity.arm_custom_bypass)) {
      proxy.onArmCustomBypass(entity.arm_custom_bypass);
    }
    if (is.function(entity.trigger)) {
      proxy.onTrigger(entity.trigger);
    }
    if (is.function(entity.arm_vacation)) {
      proxy.onArmVacation(entity.arm_vacation);
    }
    if (is.function(entity.arm_night)) {
      proxy.onArmNight(entity.arm_night);
    }
    if (is.function(entity.arm_away)) {
      proxy.onArmAway(entity.arm_away);
    }
    if (is.function(entity.arm_home)) {
      proxy.onArmHome(entity.arm_home);
    }
    if (is.function(entity.disarm)) {
      proxy.onDisarm(entity.disarm);
    }

    // - Done
    return proxy;
  };
}
