import dayjs from "dayjs";
import { v4 } from "uuid";

import { SynapseDateFormat } from "../../extensions";
import { BASIC_BOOT, TestRunner } from "../helpers";

describe("Date", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the correct keys from storage", async () => {
    await TestRunner(({ synapse, context }) => {
      const spy = jest.spyOn(synapse.storage, "add");
      synapse.date({ context, name: "test" });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          load_config_keys: ["native_value"],
        }),
      );
    }).bootstrap(BASIC_BOOT);
  });

  describe("serialization", () => {
    const TESTING_DATE = `2024-01-01`;
    describe("date", () => {
      it("events with correct types", async () => {
        const unique_id = v4();
        expect.assertions(1);
        await TestRunner(({ synapse, context, config, hass, internal }) => {
          const entity = synapse.date<{ date_type: "date" }>({
            context,
            date_type: "date",
            name: "test",
            unique_id,
          });
          entity.onSetValue(({ value }) => {
            expect(value).toBeInstanceOf(Date);
          });
          hass.socket.socketEvents.emit(
            [config.synapse.EVENT_NAMESPACE, "set_value", internal.boot.application.name].join("/"),
            { data: { unique_id } },
          );
        }).bootstrap(BASIC_BOOT);
      });

      it("loads from blank", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "date" }>({
            context,
            date_type: "date",
            name: "test",
          });
          expect(entity.native_value).toEqual(dayjs().startOf("day").toDate());
        }).bootstrap(BASIC_BOOT);
      });

      it("loads from defaulted", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const d = dayjs("2024-09-01").toDate();
          const entity = synapse.date<{ date_type: "date" }>({
            context,
            date_type: "date",
            name: "test",
            native_value: d,
          });
          expect(entity.native_value).toEqual(d);
        }).bootstrap(BASIC_BOOT);
      });

      it("can assign and retrieve", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const d = dayjs("2024-09-01").toDate();
          const entity = synapse.date<{ date_type: "date" }>({
            context,
            date_type: "date",
            name: "test",
            native_value: d,
          });
          const now = dayjs();
          entity.native_value = now.toDate();
          expect(entity.native_value).toEqual(now.startOf("day").toDate());
        }).bootstrap(BASIC_BOOT);
      });

      it("will allow some unexpected types", async () => {
        expect.assertions(4);
        await TestRunner(({ synapse, context }) => {
          const ref = dayjs("2024-09-01");
          const entity = synapse.date<{ date_type: "date" }>({
            context,
            date_type: "date",
            name: "test",
            native_value: ref.toDate(),
          });
          const formatted = ref.format("YYYY-MM-DD");
          // @ts-expect-error it's the test
          entity.native_value = ref.toISOString();
          expect(entity.native_value).toEqual(ref.toDate());
          // @ts-expect-error it's the test
          entity.native_value = dayjs(formatted);
          expect(entity.native_value).toEqual(ref.toDate());
          // @ts-expect-error it's the test
          entity.native_value = formatted;
          expect(entity.native_value).toEqual(ref.toDate());
          entity.native_value = undefined;
          expect(entity.native_value).toEqual(dayjs().startOf("day").toDate());
        }).bootstrap(BASIC_BOOT);
      });

      it("throws for invalid types", async () => {
        expect.assertions(4);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "date" }>({
            context,
            date_type: "date",
            name: "test",
          });
          expect(() => {
            entity.native_value = null;
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = {};
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = Number.NaN;
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = "invalid date";
          }).toThrow();
        }).bootstrap(BASIC_BOOT);
      });
    });

    describe("other", () => {
      it("does not affect other properties", async () => {
        expect.assertions(2);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date({
            context,
            name: "test",
            native_value: "2024-09-01",
          });
          entity.disabled = true;
          expect(entity.disabled).toBe(true);
          entity.disabled = false;
          expect(entity.disabled).toBe(false);
        }).bootstrap(BASIC_BOOT);
      });
    });

    describe("dayjs", () => {
      it("events with correct types", async () => {
        const unique_id = v4();
        expect.assertions(1);
        await TestRunner(({ synapse, context, config, hass, internal }) => {
          const entity = synapse.date<{ date_type: "dayjs" }>({
            context,
            date_type: "dayjs",
            name: "test",
            unique_id,
          });
          entity.onSetValue(({ value }) => {
            expect(value).toBeInstanceOf(dayjs);
          });
          hass.socket.socketEvents.emit(
            [config.synapse.EVENT_NAMESPACE, "set_value", internal.boot.application.name].join("/"),
            { data: { unique_id } },
          );
        }).bootstrap(BASIC_BOOT);
      });

      it("loads from blank", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date({
            context,
            date_type: "dayjs",
            name: "test",
          });
          expect(entity.native_value).toBeInstanceOf(dayjs);
        }).bootstrap(BASIC_BOOT);
      });

      it("loads from defaulted", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date({
            context,
            date_type: "dayjs",
            name: "test",
            native_value: dayjs(TESTING_DATE),
          });
          expect(entity.native_value).toEqual(dayjs(TESTING_DATE));
        }).bootstrap(BASIC_BOOT);
      });

      it("can assign and retrieve", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "dayjs" }>({
            context,
            date_type: "dayjs",
            name: "test",
            native_value: dayjs(TESTING_DATE),
          });
          entity.native_value = dayjs(Date.now());
          expect(entity.native_value).toEqual(dayjs().startOf("day"));
        }).bootstrap(BASIC_BOOT);
      });

      it("will allow some unexpected types", async () => {
        expect.assertions(4);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "dayjs" }>({
            context,
            date_type: "dayjs",
            name: "test",
            native_value: dayjs(TESTING_DATE),
          });
          const d = new Date();
          const full = d.getTime();
          d.setHours(0);
          d.setMinutes(0);
          d.setSeconds(0);
          d.setMilliseconds(0);
          const timeless = d.getTime();
          // @ts-expect-error it's the test
          entity.native_value = new Date(full);
          expect(entity.native_value).toEqual(dayjs(timeless));
          // @ts-expect-error it's the test
          entity.native_value = full;
          expect(entity.native_value).toEqual(dayjs(timeless));
          // @ts-expect-error it's the test
          entity.native_value = new Date(full).toISOString();
          expect(entity.native_value).toEqual(dayjs(timeless));
          entity.native_value = undefined;
          expect(entity.native_value).toBeInstanceOf(dayjs);
        }).bootstrap(BASIC_BOOT);
      });

      it("throws for invalid types", async () => {
        expect.assertions(4);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "dayjs" }>({
            context,
            date_type: "dayjs",
            name: "test",
            native_value: dayjs(TESTING_DATE),
          });
          expect(() => {
            entity.native_value = null;
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = {};
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = Number.NaN;
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = new Date("invalid date string");
          }).toThrow();
        }).bootstrap(BASIC_BOOT);
      });
    });

    describe("iso", () => {
      it("events with correct types", async () => {
        const unique_id = v4();
        expect.assertions(1);
        await TestRunner(({ synapse, context, config, hass, internal }) => {
          const entity = synapse.date<{ date_type: "iso" }>({
            context,
            date_type: "iso",
            name: "test",
            unique_id,
          });
          entity.onSetValue(({ value }) => {
            expect(typeof value).toBe("string");
          });
          hass.socket.socketEvents.emit(
            [config.synapse.EVENT_NAMESPACE, "set_value", internal.boot.application.name].join("/"),
            { data: { unique_id } },
          );
        }).bootstrap(BASIC_BOOT);
      });

      it("loads from blank", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date({
            context,
            date_type: "iso",
            name: "test",
          });
          expect(entity.native_value).toBe(dayjs().format("YYYY-MM-DD"));
        }).bootstrap(BASIC_BOOT);
      });

      it("loads from defaulted ISO string", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const isoDate = dayjs(TESTING_DATE).format("YYYY-MM-DD") as SynapseDateFormat;
          const entity = synapse.date({
            context,
            date_type: "iso",
            name: "test",
            native_value: isoDate,
          });
          expect(entity.native_value).toEqual(isoDate);
        }).bootstrap(BASIC_BOOT);
      });

      it("can assign and retrieve ISO format string", async () => {
        expect.assertions(1);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "iso" }>({
            context,
            date_type: "iso",
            name: "test",
          });
          const now = new Date().toISOString();
          entity.native_value = now as SynapseDateFormat;
          expect(entity.native_value).toEqual(dayjs().format("YYYY-MM-DD"));
        }).bootstrap(BASIC_BOOT);
      });

      it("handles various acceptable formats and serializes to ISO", async () => {
        // expect.assertions(4);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "iso" }>({
            context,
            name: "test",
          });
          const now = Date.now();
          const isoDate = new Date(now).toISOString();
          const today = dayjs().format("YYYY-MM-DD");

          // ISO 8601 format
          entity.native_value = isoDate as SynapseDateFormat;
          expect(entity.native_value).toEqual(today);

          // Date object
          // @ts-expect-error it's the test
          entity.native_value = new Date(now);
          expect(entity.native_value).toEqual(today);

          // Milliseconds timestamp
          // @ts-expect-error it's the test
          entity.native_value = now;
          expect(entity.native_value).toEqual(today);

          // Undefined should default to undefined
          entity.native_value = undefined;
          expect(entity.native_value).toBe(today);
        }).bootstrap(BASIC_BOOT);
      });

      it("throws for invalid types", async () => {
        expect.assertions(4);
        await TestRunner(({ synapse, context }) => {
          const entity = synapse.date<{ date_type: "iso" }>({
            context,
            name: "test",
          });
          expect(() => {
            entity.native_value = null;
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = {};
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = Number.NaN;
          }).toThrow();
          expect(() => {
            // @ts-expect-error it's the test
            entity.native_value = "invalid string";
          }).toThrow();
        }).bootstrap(BASIC_BOOT);
      });
    });
  });

  it("set up up correct bus transfer events", async () => {
    const unique_id = v4();
    const events = ["set_value"];
    expect.assertions(events.length);

    await TestRunner(({ hass, event, synapse, context, config, internal }) => {
      synapse.date({ context, name: "test", unique_id });
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
});
