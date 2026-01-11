import type { EventEmitter } from "node:events";

import type { ByIdProxy, HassEntityContext } from "@digital-alchemy/hass";
import { v4 } from "uuid";

import { synapseTestRunner } from "../mock/index.mts";

describe("Generator", () => {
  afterEach(async () => {
    await synapseTestRunner.teardown();
    vi.restoreAllMocks();
  });

  // #MARK: domain property
  describe("domain property", () => {
    it("returns correct domain for sensor entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const sensor = synapse.sensor({ context, name: "test" });
        expect(sensor.domain).toBe("sensor");
      });
    });

    it("returns correct domain for binary_sensor entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const binarySensor = synapse.binary_sensor({ context, name: "test" });
        expect(binarySensor.domain).toBe("binary_sensor");
      });
    });

    it("returns correct domain for switch entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const switchEntity = synapse.switch({ context, name: "test" });
        expect(switchEntity.domain).toBe("switch");
      });
    });

    it("returns correct domain for button entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const button = synapse.button({ context, name: "test" });
        expect(button.domain).toBe("button");
      });
    });

    it("returns correct domain for lock entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const lock = synapse.lock({ context, name: "test" });
        expect(lock.domain).toBe("lock");
      });
    });

    it("returns correct domain for number entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const number = synapse.number({ context, name: "test" });
        expect(number.domain).toBe("number");
      });
    });

    it("returns correct domain for text entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const text = synapse.text({ context, name: "test" });
        expect(text.domain).toBe("text");
      });
    });

    it("returns correct domain for select entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const select = synapse.select({ context, name: "test", options: ["a", "b"] });
        expect(select.domain).toBe("select");
      });
    });

    it("returns correct domain for scene entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const scene = synapse.scene({ context, name: "test" });
        expect(scene.domain).toBe("scene");
      });
    });

    it("returns correct domain for date entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const date = synapse.date({ context, name: "test" });
        expect(date.domain).toBe("date");
      });
    });

    it("returns correct domain for datetime entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const datetime = synapse.datetime({ context, name: "test" });
        expect(datetime.domain).toBe("datetime");
      });
    });

    it("returns correct domain for time entities", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const time = synapse.time({ context, name: "test" });
        expect(time.domain).toBe("time");
      });
    });

    it("domain property is included in ownKeys", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const sensor = synapse.sensor({ context, name: "test" });
        expect(Object.keys(sensor)).toContain("domain");
      });
    });

    it("domain property is accessible via 'in' operator", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context }) => {
        const sensor = synapse.sensor({ context, name: "test" });
        expect("domain" in sensor).toBe(true);
      });
    });

    it("domain property is read-only", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context, lifecycle }) => {
        lifecycle.onReady(() => {
          const sensor = synapse.sensor({ context, name: "test" });
          expect(() => {
            // @ts-expect-error test
            sensor.domain = "other";
          }).toThrow();
        });
      });
    });
  });

  // #MARK: isRegistered
  describe("operators", () => {
    const SENSOR_KEYS = [
      "domain",
      "getEntity",
      "storage",
      "onUpdate",
      "device_class",
      "last_reset",
      "state",
      "suggested_display_precision",
      "suggested_unit_of_measurement",
      "unit_of_measurement",
      "attributes",
      "device_id",
      "entity_category",
      "icon",
      "disabled",
      "name",
      "suggested_object_id",
      "translation_key",
      "unique_id",
    ];

    describe("delete", () => {
      it("does not allow deletes on non-locals", async () => {
        expect.assertions(SENSOR_KEYS.length);
        await synapseTestRunner.run(({ synapse, context }) => {
          const sensor = synapse.sensor({ context, name: "test" });

          SENSOR_KEYS.forEach(i => expect(() => delete sensor[i as keyof typeof sensor]).toThrow());
        });
      });
    });

    describe("ownKeys", () => {
      it("returns correct keys", async () => {
        expect.assertions(1);
        await synapseTestRunner.run(({ synapse, context }) => {
          const sensor = synapse.sensor({ context, name: "test" });
          expect(Object.keys(sensor)).toEqual(expect.arrayContaining(["locals", ...SENSOR_KEYS]));
        });
      });
    });

    describe("has", () => {
      it("returns true for expected entities", async () => {
        expect.assertions(SENSOR_KEYS.length);
        await synapseTestRunner.run(({ synapse, context }) => {
          const sensor = synapse.sensor({ context, name: "test" });
          SENSOR_KEYS.forEach(key => expect(key in sensor).toBe(true));
        });
      });

      it("returns true for unexpected entities", async () => {
        expect.assertions(1);
        await synapseTestRunner.run(({ synapse, context }) => {
          const sensor = synapse.sensor({ context, name: "test" });
          expect("unknown_key" in sensor).toBe(false);
        });
      });
    });

    describe("get", () => {
      const unique_id = v4();

      describe("getEntity", () => {
        it("getEntity stores and returns reference when entityRefs is empty", async () => {
          expect.assertions(2);
          vi.spyOn(console, "trace").mockImplementationOnce(() => undefined);
          await synapseTestRunner.run(({ synapse, context, hass }) => {
            const sensor = synapse.sensor({ context, name: "test", unique_id });
            const mockId = "sensor.magic";
            const mockRef = {
              attributes: {},
              context: {} as HassEntityContext,
              entity_id: mockId,
              last_changed: new Date(),
              last_reported: new Date(),
              last_updated: new Date(),
              state: "on",
            };

            vi.spyOn(hass.idBy, "unique_id").mockReturnValueOnce("sensor.magic");
            vi.spyOn(hass.refBy, "id").mockReturnValueOnce(
              mockRef as unknown as ByIdProxy<"sensor.magic">,
            );

            const result = sensor.getEntity();
            expect(hass.idBy.unique_id).toHaveBeenCalledWith(unique_id);
            expect(result).toBe(mockRef);
          });
        });

        it("getEntity attempts to look up by unique_id", async () => {
          expect.assertions(2);
          vi.spyOn(console, "trace").mockImplementationOnce(() => undefined);
          await synapseTestRunner.run(({ synapse, context, hass }) => {
            const sensor = synapse.sensor({ context, name: "test", unique_id });
            const spy = vi.spyOn(hass.idBy, "unique_id");
            sensor.getEntity();
            expect(spy).toHaveBeenCalledWith(unique_id);
            expect(spy).toHaveReturnedWith(undefined);
          });
        });
      });

      it("unknown properties return undefined", async () => {
        expect.assertions(1);
        await synapseTestRunner.run(({ synapse, context }) => {
          const sensor = synapse.sensor({ context, name: "test", unique_id });
          const INVALID_KEY = "some random key" as keyof typeof sensor;
          expect(sensor[INVALID_KEY]).toBeUndefined();
        });
      });

      describe("onUpdate", () => {
        it("watches for unique_id", async () => {
          expect.assertions(1);
          vi.spyOn(console, "trace").mockImplementationOnce(() => undefined);
          await synapseTestRunner.run(({ synapse, context, event }) => {
            const sensor = synapse.sensor({ context, name: "test", unique_id });
            const spy = vi.spyOn(event, "on");
            sensor.onUpdate(() => {});
            expect(spy).toHaveBeenCalledWith(unique_id, expect.any(Function));
          });
        });

        it("is removable", async () => {
          expect.assertions(1);
          vi.spyOn(console, "trace").mockImplementationOnce(() => undefined);
          await synapseTestRunner.run(({ synapse, context, event }) => {
            const sensor = synapse.sensor({ context, name: "test", unique_id });
            let removable: unknown;
            const spy = vi.spyOn(event, "on").mockImplementation((_, callback) => {
              removable = callback;
              return {} as EventEmitter;
            });
            const { remove } = sensor.onUpdate(() => {});
            remove();
            expect(spy).toHaveBeenCalledWith(unique_id, removable);
          });
        });

        it("passes in correct params to callbacks", async () => {
          expect.assertions(1);
          vi.spyOn(console, "trace").mockImplementationOnce(() => undefined);
          await synapseTestRunner.run(({ synapse, context, event }) => {
            const sensor = synapse.sensor({ context, name: "test", unique_id });
            const callback = vi.fn();
            const { remove } = sensor.onUpdate(callback);
            const new_state = {};
            const old_state = {};
            event.emit(unique_id, new_state, old_state);
            expect(callback).toHaveBeenCalledWith(new_state, old_state, remove);
          });
        });

        it("wraps executions in safeExec", async () => {
          expect.assertions(1);
          vi.spyOn(console, "trace").mockImplementationOnce(() => undefined);
          await synapseTestRunner.run(({ synapse, context, event, internal }) => {
            const sensor = synapse.sensor({ context, name: "test", unique_id });
            const spy = vi.spyOn(internal, "safeExec");
            const callback = vi.fn();
            sensor.onUpdate(callback);
            event.emit(unique_id, {}, {});
            expect(spy).toHaveBeenCalled();
          });
        });
      });
    });

    describe("set", () => {
      it("does not allow setting of expected properties", async () => {
        expect.assertions(2);
        await synapseTestRunner.run(({ synapse, context, lifecycle }) => {
          const sensor = synapse.sensor({ context, name: "test" });
          lifecycle.onReady(() => {
            expect(() => {
              // @ts-expect-error it's the test
              sensor.unique_id = v4();
            }).toThrow();
            expect(() => {
              // @ts-expect-error it's the test
              sensor.some_random_property = v4();
            }).toThrow();
          });
        });
      });
    });
  });

  describe("property interactions", () => {
    it("hard default is undefined", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context, lifecycle }) => {
        lifecycle.onReady(() => {
          const sensor = synapse.sensor({ context, name: "test" });
          expect(sensor.icon).toBe(undefined);
        });
      });
    });

    it("default will use params", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context, lifecycle }) => {
        lifecycle.onReady(() => {
          const sensor = synapse.sensor({ context, icon: "foo:bar", name: "test" });
          expect(sensor.icon).toBe("foo:bar");
        });
      });
    });

    it("tracks runtime values", async () => {
      expect.assertions(1);
      await synapseTestRunner.run(({ synapse, context, lifecycle }) => {
        lifecycle.onReady(() => {
          const random = v4();
          const sensor = synapse.sensor({ context, icon: "foo:bar", name: "test" });
          sensor.icon = random;
          expect(sensor.icon).toBe(random);
        });
      });
    });
  });
});
