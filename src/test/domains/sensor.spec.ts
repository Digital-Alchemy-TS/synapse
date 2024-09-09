import { v4 } from "uuid";

import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Sensor", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    expect.assertions(1);
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.sensor({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: [
            "device_class",
            "state",
            "unit_of_measurement",
            "last_reset",
            "suggested_display_precision",
            "suggested_unit_of_measurement",
          ],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });

  it("set up up correct bus transfer events", async () => {
    const unique_id = v4();
    const events = ["activate"];
    expect.assertions(events.length);

    await TestRunner(({ hass, event, synapse, context, config, internal }) => {
      synapse.scene({ context, name: "test", unique_id });
      // - run through each event
      events.forEach(name => {
        const fn = jest.fn();

        // attach listener for expected internal event
        event.on(["synapse", name, unique_id].join("/"), fn);

        // emit artificial socket event
        hass.socket.socketEvents.emit(
          [config.synapse.EVENT_NAMESPACE, name, internal.boot.application.name].join("/"),
          { data: { unique_id } },
        );

        // profit
        expect(fn).toHaveBeenCalled();
      });
    }).bootstrap(BASIC_BOOT);
  });

  describe("configuration combinations", () => {
    it("does not allow state_class with options", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse, context }) => {
        expect(() => {
          synapse.sensor({
            context,
            device_class: "enum",
            name: "test",
            options: [],
            sensor_type: "string",
            // @ts-expect-error it's the test
            state_class: "foo",
          });
        }).toThrow();
      }).bootstrap(BASIC_BOOT);
    });

    it("does not allow native_unit_of_measurement with options", async () => {
      expect.assertions(1);
      await TestRunner(({ synapse, context }) => {
        expect(() => {
          synapse.sensor({
            context,
            device_class: "enum",
            name: "test",
            // @ts-expect-error it's the test
            native_unit_of_measurement: "foo",
            options: [],
            sensor_type: "string",
          });
        }).toThrow();
      }).bootstrap(BASIC_BOOT);
    });
  });

  describe("device_class datatypes", () => {
    //
  });
});
