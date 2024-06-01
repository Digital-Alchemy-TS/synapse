import { TServiceParams } from "@digital-alchemy/core";

export function EntityGenerator({ scheduler, synapse, context, logger }: TServiceParams) {
  try {
    const sensor = synapse.sensor({
      attributes: {
        destination: "saturn",
      },
      context,
      device_class: "speed",
      // entity_category: "diagnostic",
      name: "Test the sensor",

      state: 10,
      suggested_object_id: "magic_the_sensor",
      unit_of_measurement: "ft/s",
    });
    const binary_sensor = synapse.binary_sensor({
      context,
      device_class: "window",
      name: "blinkey",
      suggested_object_id: "blinkey_the_binary_sensor",
    });
    // scheduler.interval({
    //   exec() {
    //     sensor.state = Math.floor(Math.random() * 1000);
    //     binary_sensor.is_on = !binary_sensor.is_on;
    //   },
    //   interval: SECOND,
    // });
    const button = synapse.button({
      context,
      device_class: "identify",
      name: "example button",
      press() {
        logger.info("press()");
      },
      suggested_object_id: "button_the_example",
    });
    button.onPress(() => {
      logger.info("onPress()");
    });
    // const scene = synapse.scene({
    //   activate() {
    //     logger.info("scene activated");
    //   },
    //   context,
    //   name: "Dynamic Scene",
    //   suggested_object_id: "setting_the_stage",
    // });
    // scene.onActivate(() => {
    //   logger.info("scene activated callback");
    // });
    // synapse.switch({
    //   context,
    //   name: "Example switch",
    // });
    // // const acp = synapse.alarm_control_panel({
    // //   arm_night({ code }) {
    // //     logger.info({ code }, `arm_night called with code via static attachment`);
    // //   },
    // //   context,
    // //   name: "Example alarm panel",
    // // });
    // // acp.onArmNight(({ code }) =>
    // //   logger.info({ code }, `arm_night called with code via dynamic attachment`),
    // // );
    // // synapse.lock({
    // //   context,
    // //   is_locked: false,
    // //   name: "Example lock",
    // //   suggested_object_id: "example_the_lock",
    // // });
    // synapse.number({
    //   context,
    //   name: "Example number",
    //   native_max_value: 420,
    //   native_min_value: 69,
    //   suggested_object_id: "example_the_number",
    // });
    // synapse.text({
    //   context,
    //   name: "Example text",
    //   native_value: "banana",
    //   suggested_object_id: "example_the_text",
    // });
    // synapse.select({
    //   context,
    //   current_option: "a",
    //   name: "Example select",
    //   options: ["a", "b", "c"],
    //   suggested_object_id: "example_the_select",
    // });
    // synapse.datetime({
    //   context,
    //   name: "Example datetime",
    //   native_value: dayjs("2024-01-01 00:00:00"),
    //   suggested_object_id: "example_the_datetime",
    // });
    // synapse.date({
    //   context,
    //   name: "Example date",
    //   native_value: "2006-06-06",
    //   suggested_object_id: "example_the_date",
    // });
    // synapse.time({
    //   context,
    //   name: "Example time",
    //   native_value: "14:32:51",
    //   suggested_object_id: "example_the_time",
    // });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}
