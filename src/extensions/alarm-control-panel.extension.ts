import { TBlackHole, TServiceParams } from "@digital-alchemy/core";
import { PICK_ENTITY } from "@digital-alchemy/hass";

import {
  ALARM_CONTROL_PANEL_CONFIGURATION_KEYS,
  AlarmControlPanelConfiguration,
  AlarmControlPanelValue,
  HassAlarmControlPanelEvent,
  RemoveReturn,
  TAlarmControlPanel,
  TRegistry,
  UpdateCallback,
} from "..";

export type TVirtualAlarmControlPanel<
  STATE extends AlarmControlPanelValue = AlarmControlPanelValue,
  ATTRIBUTES extends object = object,
  CONFIGURATION extends
    AlarmControlPanelConfiguration = AlarmControlPanelConfiguration,
  ENTITY_ID extends // @ts-expect-error is fine
    PICK_ENTITY<"alarm_control_panel"> = PICK_ENTITY<"alarm_control_panel">,
> = {
  /**
   * Do not define attributes that change frequently.
   * Create new sensors instead
   */
  attributes: ATTRIBUTES;
  configuration: CONFIGURATION;
  _rawAttributes: ATTRIBUTES;
  _rawConfiguration: ATTRIBUTES;
  name: string;
  /**
   * Receive disarm command.
   */
  onAlarmDisarm: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm home command.
   */
  onAlarmArmHome: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm away command.
   */
  onAlarmArmAway: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm night command.
   */
  onAlarmNight: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm vacation command.
   */
  onAlarmArmVacation: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm vacation command.
   */
  onAlarmTrigger: (code: string, remove: () => void) => RemoveReturn;
  /**
   * Receive arm custom bypass command.
   */
  onAlarmCustomBypass: (code: string, remove: () => void) => RemoveReturn;
  /**
   * look up the entity id, and
   */
  onUpdate: UpdateCallback<ENTITY_ID>;
  /**
   * the current state
   */
  state: STATE;
  /**
   * Used to uniquely identify this entity in home assistant
   */
  unique_id: string;
};

export function VirtualAlarmControlPanel({
  context,
  synapse,
  internal,
  hass,
  event,
  logger,
}: TServiceParams) {
  const registry = synapse.registry.create<TVirtualAlarmControlPanel>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      configuration: entity._rawConfiguration,
      state: entity.state,
    }),
    // @ts-expect-error it's fine
    domain: "alarm_control_panel",
  });

  // #MARK: create
  function create<
    STATE extends AlarmControlPanelValue = AlarmControlPanelValue,
    ATTRIBUTES extends object = object,
    CONFIGURATION extends
      AlarmControlPanelConfiguration = AlarmControlPanelConfiguration,
  >(entity: TAlarmControlPanel<STATE, ATTRIBUTES>) {
    const eventBuilder = (name: string) =>
      function (callback: (code: string, remove: () => void) => TBlackHole) {
        const remove = () => event.removeListener(EVENT(name), exec);
        const exec = async (code: string) =>
          internal.safeExec(async () => await callback(code, remove));
        event.on(EVENT(name), exec);
        return { remove };
      };
    const entityOut = new Proxy(
      {} as TVirtualAlarmControlPanel<STATE, ATTRIBUTES>,
      {
        // #MARK: get
        get(_, property: keyof TVirtualAlarmControlPanel<STATE, ATTRIBUTES>) {
          // * state
          if (property === "state") {
            return loader.state;
          }
          // * name
          if (property === "name") {
            return entity.name;
          }
          // * unique_id
          if (property === "unique_id") {
            return unique_id;
          }
          // * onAlarmDisarm
          if (property === "onAlarmDisarm") {
            return eventBuilder("alarm_disarm");
          }
          // * onAlarmArmHome
          if (property === "onAlarmArmHome") {
            return eventBuilder("alarm_arm_home");
          }
          // * onAlarmArmAway
          if (property === "onAlarmArmAway") {
            return eventBuilder("alarm_arm_away");
          }
          // * onAlarmNight
          if (property === "onAlarmNight") {
            return eventBuilder("alarm_arm_night");
          }
          // * onAlarmArmVacation
          if (property === "onAlarmArmVacation") {
            return eventBuilder("alarm_arm_vacation");
          }
          // * onAlarmTrigger
          if (property === "onAlarmTrigger") {
            return eventBuilder("alarm_trigger");
          }
          // * onAlarmCustomBypass
          if (property === "onAlarmCustomBypass") {
            return eventBuilder("alarm_custom_bypass");
          }
          // * onUpdate
          if (property === "onUpdate") {
            return loader.onUpdate();
          }
          // * _rawConfiguration
          if (property === "_rawConfiguration") {
            return loader.configuration;
          }
          // * _rawAttributes
          if (property === "_rawAttributes") {
            return loader.attributes;
          }
          // * attributes
          if (property === "attributes") {
            return new Proxy({} as ATTRIBUTES, {
              get: <KEY extends Extract<keyof ATTRIBUTES, string>>(
                _: ATTRIBUTES,
                property: KEY,
              ) => {
                return loader.attributes[property];
              },
              set: <
                KEY extends Extract<keyof ATTRIBUTES, string>,
                VALUE extends ATTRIBUTES[KEY],
              >(
                _: ATTRIBUTES,
                property: KEY,
                value: VALUE,
              ) => {
                loader.setAttribute(property, value);
                return true;
              },
            });
          }
          // * configuration
          if (property === "configuration") {
            return new Proxy({} as CONFIGURATION, {
              get: <KEY extends Extract<keyof CONFIGURATION, string>>(
                _: CONFIGURATION,
                property: KEY,
              ) => {
                return loader.configuration[property];
              },
              set: <
                KEY extends Extract<keyof CONFIGURATION, string>,
                VALUE extends CONFIGURATION[KEY],
              >(
                _: CONFIGURATION,
                property: KEY,
                value: VALUE,
              ) => {
                loader.setConfiguration(property, value);
                return true;
              },
            });
          }
          return undefined;
        },
        // #MARK: ownKeys
        ownKeys: () => {
          return [
            "attributes",
            "configuration",
            "_rawAttributes",
            "_rawConfiguration",
            "name",
            "is_on",
            "onUpdate",
            "state",
          ];
        },
        // #MARK: set
        set(_, property: string, value: unknown) {
          if (property === "state") {
            loader.setState(value as STATE);
            return true;
          }
          if (property === "is_on") {
            const new_state = ((value as boolean) ? "on" : "off") as STATE;
            loader.setState(new_state);
            return true;
          }
          if (property === "attributes") {
            loader.setAttributes(value as ATTRIBUTES);
            return true;
          }
          return false;
        },
      },
    );

    const unique_id = registry.add(entityOut, entity);
    const EVENT = (event: string) =>
      `alarm_control_panel/${unique_id}/${event}`;

    [
      "alarm_disarm",
      "alarm_arm_away",
      "alarm_arm_night",
      "alarm_arm_home",
      "alarm_arm_vacation",
      "alarm_arm_custom_bypass",
      "alarm_trigger",
    ].forEach(name => {
      hass.socket.onEvent({
        context,
        event: synapse.registry.eventName(name),
        exec({ data: { unique_id: id, code } }: HassAlarmControlPanelEvent) {
          if (id !== unique_id) {
            return;
          }
          logger.trace({ context, unique_id }, name);
          event.emit(EVENT(name), code);
        },
      });
    });

    const loader = synapse.storage.wrapper<STATE, ATTRIBUTES, CONFIGURATION>({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
      value: {
        attributes: (entity.defaultAttributes ?? {}) as ATTRIBUTES,
        configuration: Object.fromEntries(
          ALARM_CONTROL_PANEL_CONFIGURATION_KEYS.map(key => [key, entity[key]]),
        ) as unknown as CONFIGURATION,
        state: (entity.defaultState ?? "off") as STATE,
      },
    });
    return entityOut;
  }

  return create;
}
