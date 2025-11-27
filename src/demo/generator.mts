import type { TServiceParams } from "@digital-alchemy/core";
import { SECOND } from "@digital-alchemy/core";

import { ServiceField } from "../index.mts";

export function DemoEntityGenerator({ scheduler, synapse, context, logger }: TServiceParams) {
  try {
    logger.info("Starting demo entity generation...");

    // Create a device to group our entities
    const demoDevice = synapse.device.register("demo_device", {
      manufacturer: "Digital Alchemy",
      model: "Synapse Demo",
      name: "Synapse Dynamic Demo Device",
      sw_version: "1.0.0",
    });

    // Create a temperature sensor that updates every 30 seconds
    const temperatureSensor = synapse.sensor<{
      device_class: "temperature";
    }>({
      context,
      device_class: "temperature",
      // device_id: demoDevice,
      name: "Demo Temperature Sensor",
      state: 22.5,
      suggested_object_id: "demo_temperature_sensor",
      unit_of_measurement: "°C",
    });

    // Create a binary sensor for demo purposes
    const motionSensor = synapse.binary_sensor({
      context,
      device_class: "motion",
      device_id: demoDevice,
      name: "Demo Motion Sensor",
      suggested_object_id: "demo_motion_sensor",
    });

    synapse.service.create(
      {
        context,
        description: "No description",
        fields: {
          delay: ServiceField.Number({
            default: 0,
            description: "Delay in seconds",
            max: 300,
            min: 0,
            required: true,
            step: 1,
            unit_of_measurement: "s",
          }),
          message: ServiceField.Text({
            description: "Message to send",
            multiline: true,
            required: true,
          }),
          target_entity: ServiceField.Entity({
            description: "Entity to target",
            domain: ["binary_sensor", "button", "climate"],
            integration: "synapse",
            required: false,
          }),
        },
        name: "test_service",
        response: {
          optional: true,
        },
        target: {
          entity: {
            domain: "sensor",
          },
        },
      },
      async data => {
        if (data.target_entity === "climate.test_climate") {
          //
        }
        if (data.delay) {
          //
        }
        logger.warn({ data }, "HIT");
      },
    );

    // Create a switch that can be controlled
    // setTimeout(() => {
    //   logger.warn("CREATE");
    //   const demoSwitch = synapse.switch({
    //     context,
    //     device_id: demoDevice,
    //     is_on: false,
    //     name: "Demo Switch",
    //     suggested_object_id: "demo_switch",
    //     turn_off() {
    //       logger.error("turn_off");
    //     },
    //     turn_on() {
    //       logger.error("turn_on");
    //     },
    //   });
    //   // Set up button press callback
    //   demoButton.onPress(() => {
    //     logger.info("Demo button onPress callback triggered");
    //     // Toggle the switch when button is pressed
    //     const currentState = demoSwitch.is_on || false;
    //     demoSwitch.is_on = !currentState;
    //   });
    // }, 10 * SECOND);

    // Create a button that logs when pressed
    const demoButton = synapse.button({
      context,
      device_class: "identify",
      device_id: demoDevice,
      name: "Demo Button",
      press() {
        logger.info("Demo button pressed!");
      },
      suggested_object_id: "demo_button",
    });

    synapse.number({
      context,
      mode: "slider",
      name: "Gallons",
      native_max_value: 20,
      native_min_value: 1,
      step: 0.5,
    });

    synapse.select({
      context,
      name: "Current mode",
      options: ["a", "b", "c", "d"],
    });

    synapse.date({
      context,
      date_type: "dayjs",
      name: "Tent 1 Grow Start",
    });

    demoButton.onPress(async () => {
      const list = await synapse.socket.listAbandonedEntities();
      logger.error({ list }, "listAbandonedEntities");
    });

    // Set up periodic updates to simulate real device behavior
    scheduler.setInterval(() => {
      // Update temperature with some variation (safe for demo purposes)
      const currentTemp = temperatureSensor.state || 22.5;
      // eslint-disable-next-line sonarjs/pseudo-random
      const variation = (Math.random() - 0.5) * 2; // ±1°C variation
      const newTemp = Math.round((Number(currentTemp) + variation) * 10) / 10;
      temperatureSensor.state = newTemp;

      // Randomly toggle motion sensor (safe for demo purposes)
      // eslint-disable-next-line sonarjs/pseudo-random
      if (Math.random() > 0.8) {
        motionSensor.is_on = !motionSensor.is_on;
      }

      logger.debug({ temperature: newTemp }, "Updated demo entities");
    }, 5 * SECOND);

    logger.info("Demo entity generation completed successfully");
  } catch (error) {
    logger.error("Error in demo entity generation", error);
    throw error;
  }
}
