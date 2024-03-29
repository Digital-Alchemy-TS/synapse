import {
  each,
  is,
  NOT_FOUND,
  TBlackHole,
  TContext,
  TServiceParams,
} from "@digital-alchemy/core";

import { SensorDeviceClasses } from "..";

type TSensor<STATE extends SensorValue, ATTRIBUTES extends object = object> = {
  context: TContext;
  defaultState?: STATE;
  icon?: string;
  defaultAttributes?: ATTRIBUTES;
  name: string;
} & SensorDeviceClasses;

type SensorValue = string | number;
type SwitchUpdateCallback<
  STATE extends SensorValue = SensorValue,
  ATTRIBUTES extends object = object,
> = (options: { state?: STATE; attributes?: ATTRIBUTES }) => TBlackHole;

export type VirtualSensor<
  STATE extends SensorValue = SensorValue,
  ATTRIBUTES extends object = object,
> = {
  icon: string;
  attributes: ATTRIBUTES;
  _rawAttributes?: ATTRIBUTES;
  name: string;
  onUpdate: (callback: SwitchUpdateCallback<STATE, ATTRIBUTES>) => void;
  state: STATE;
} & SensorDeviceClasses;

export function Sensor({
  logger,
  context,
  internal,
  lifecycle,
  synapse,
}: TServiceParams) {
  const registry = synapse.registry<VirtualSensor>({
    context,
    details: entity => ({
      attributes: entity._rawAttributes,
      device_class: entity.device_class,
      state: entity.state,
      unit_of_measurement: entity.unit_of_measurement,
    }),
    domain: "sensor",
  });

  // # Sensor creation function
  function create<
    STATE extends SensorValue = SensorValue,
    ATTRIBUTES extends object = object,
  >(entity: TSensor<STATE, ATTRIBUTES>) {
    type CacheValue = {
      attributes: ATTRIBUTES;
      state: STATE;
    };

    const callbacks = [] as SwitchUpdateCallback[];
    let state: STATE;
    let attributes: ATTRIBUTES;

    function setState(newState: STATE) {
      if (state === newState) {
        return;
      }
      logger.trace({ name: entity.name, newState }, `update sensor state`);
      state = newState;
      setImmediate(async () => {
        await registry.setCache(id, { attributes, state });
        await registry.send(id, { state });

        await each(
          callbacks,
          async callback =>
            await internal.safeExec(async () => await callback({ state })),
        );
      });
    }

    function setAttributes(newAttributes: ATTRIBUTES) {
      if (is.equal(attributes, newAttributes)) {
        return;
      }
      attributes = newAttributes;
      setImmediate(async () => {
        logger.trace({ attributes, id }, `update sensor attributes (all)`);
        await registry.setCache(id, { attributes, state });
        await registry.send(id, { attributes });

        await each(
          callbacks,
          async callback =>
            await internal.safeExec(async () => await callback({ attributes })),
        );
      });
    }

    async function setAttribute<
      KEY extends keyof ATTRIBUTES,
      VALUE extends ATTRIBUTES[KEY],
    >(key: KEY, value: VALUE) {
      if (is.equal(attributes[key], value)) {
        return;
      }
      attributes[key] = value;
      setImmediate(async () => {
        logger.trace({ id, key, value }, `update sensor attributes (single)`);
        await registry.setCache(id, { attributes, state });
        await registry.send(id, { attributes });

        await each(
          callbacks,
          async callback =>
            await internal.safeExec(async () => await callback({ attributes })),
        );
      });
    }

    // ## Wait until bootstrap to load cache
    lifecycle.onBootstrap(async () => {
      let data = await registry.getCache<CacheValue>(id);
      if (!data) {
        data = {
          attributes: entity.defaultAttributes,
          state: entity.defaultState,
        };
        registry.loadFromHass<CacheValue>(id, data => {
          if (is.empty(data)) {
            // wat
            return;
          }
          logger.debug({ data, id, name: entity.name }, `received value`);
          state = data.state;
          attributes = data.attributes;
        });
      }
      state = data.state;
      attributes = data.attributes;
    });

    // ## Proxy object as return
    const sensorOut = new Proxy({} as VirtualSensor<STATE, ATTRIBUTES>, {
      // ### Getters
      get(_, property: keyof VirtualSensor<STATE, ATTRIBUTES>) {
        if (property === "state") {
          return state;
        }
        if (property === "unit_of_measurement") {
          return entity.unit_of_measurement;
        }
        if (property === "device_class") {
          return entity.device_class;
        }
        if (property === "name") {
          return entity.name;
        }
        if (property === "onUpdate") {
          return (callback: SwitchUpdateCallback) => {
            callbacks.push(callback);
            return () => {
              const index = callbacks.indexOf(callback);
              if (index !== NOT_FOUND) {
                callbacks.splice(callbacks.indexOf(callback));
              }
            };
          };
        }
        if (property === "_rawAttributes") {
          return attributes;
        }
        if (property === "attributes") {
          return new Proxy({} as ATTRIBUTES, {
            get: <KEY extends Extract<keyof ATTRIBUTES, string>>(
              _: ATTRIBUTES,
              property: KEY,
            ) => {
              return attributes[property];
            },
            set: <
              KEY extends Extract<keyof ATTRIBUTES, string>,
              VALUE extends ATTRIBUTES[KEY],
            >(
              _: ATTRIBUTES,
              property: KEY,
              value: VALUE,
            ) => {
              setAttribute(property, value);
              return true;
            },
          });
        }
        if (property === "icon") {
          return entity.icon;
        }
        return undefined;
      },
      ownKeys: () => {
        return [
          "state",
          "unit_of_measurement",
          "device_class",
          "name",
          "onUpdate",
          "attributes",
        ];
      },
      // ### Setters
      set(_, property: string, value: unknown) {
        if (property === "state") {
          setState(value as STATE);
          return true;
        }
        if (property === "attributes") {
          setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // ## Validate a good id was passed, and it's the only place in code that's using it
    const id = registry.add(sensorOut);

    return sensorOut;
  }

  return create;
}
