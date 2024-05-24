import { SECOND, TServiceParams } from "@digital-alchemy/core";

export function EntityGenerator({
  scheduler,
  synapse,
  context,
  logger,
}: TServiceParams) {
  const sensor = synapse.sensor({
    area_id: "bedroom",
    context,
    defaultAttributes: {
      destination: "saturn",
    },
    defaultState: 10 as number,
    device_class: "speed",
    entity_category: "diagnostic",
    name: "Test the sensor",
    suggested_object_id: "magic_the_sensor",
    unit_of_measurement: "ft/s",
  });

  const binary_sensor = synapse.binary_sensor({
    context,
    device_class: "window",
    name: "blinkey",
    suggested_object_id: "blinkey_the_binary_sensor",
  });

  scheduler.interval({
    exec() {
      sensor.state = Math.floor(Math.random() * 1000);
      binary_sensor.is_on = !binary_sensor.is_on;
    },
    interval: 10 * SECOND,
  });

  synapse.button({
    context,
    device_class: "identify",
    exec() {
      logger.info("button pressed");
    },
    name: "example button",
    suggested_object_id: "button_the_example",
  });

  // ["high", "medium", "low"].forEach(i =>
  //   synapse.scene({
  //     context,
  //     exec() {
  //       logger.info(`activate bedroom ${i}`);
  //     },
  //     name: `bedroom_${i}`,
  //   }),
  // );
  // return { binary_sensor, sensor };
}
