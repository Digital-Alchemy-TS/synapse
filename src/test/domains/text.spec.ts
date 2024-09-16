import { v4 } from "uuid";

import { synapseTestRunner } from "../../mock";

describe("Text", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await synapseTestRunner.run(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.text({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: ["mode", "native_max", "native_min", "pattern", "native_value"],
        }),
      );
    });
  });

  it("set up up correct bus transfer events", async () => {
    const unique_id = v4();
    const events = ["set_value"];
    expect.assertions(events.length);

    await synapseTestRunner.run(({ hass, event, synapse, context, config, internal }) => {
      synapse.text({ context, name: "test", unique_id });
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
    });
  });
});
