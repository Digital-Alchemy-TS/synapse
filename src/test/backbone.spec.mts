import { synapseTestRunner } from "../mock/index.mts";

describe("Backbone (Pillar 1)", () => {
  afterEach(async () => {
    await synapseTestRunner.teardown();
    vi.restoreAllMocks();
  });

  it("synapse switch toggle fires hass-bus listener (cross-module bus event)", async () => {
    expect.assertions(1);
    await synapseTestRunner.run(({ synapse, context, lifecycle, event }) => {
      // Switch name -> suggested_object_id "bridge_test_switch" -> entity_id "switch.bridge_test_switch"
      const sw = synapse.switch({ context, name: "bridge_test_switch" });
      const spy = vi.fn();

      lifecycle.onReady(async () => {
        event.on("switch.bridge_test_switch", spy);

        // Toggle the switch from the TS side — triggers storage.set -> bridge -> hass bus
        sw.is_on = true;

        // Settle: bridge is async through socket path
        await new Promise<void>(r => {
          setTimeout(r, 100);
        });

        expect(spy).toHaveBeenCalled();
      });
    });
  });

  it("single synapse write yields exactly one hass-bus event, no re-entrant storage.set (F6)", async () => {
    expect.assertions(2);
    await synapseTestRunner.run(({ synapse, context, lifecycle, event }) => {
      const sw = synapse.switch({ context, name: "loop_guard_switch" });

      lifecycle.onReady(async () => {
        let storageSetCount = 0;

        // Wrap the storage.set to count invocations after ready
        const origSet = sw.storage.set.bind(sw.storage);
        sw.storage.set = async (key, value) => {
          storageSetCount++;
          return origSet(key, value);
        };

        const busSpy = vi.fn();
        event.on("switch.loop_guard_switch", busSpy);

        sw.is_on = false;

        await new Promise<void>(r => {
          setTimeout(r, 150);
        });

        // One hass-bus event, no re-entrant storage.set calls from bridge
        expect(busSpy).toHaveBeenCalledTimes(1);
        expect(storageSetCount).toBe(1);
      });
    });
  });
});
