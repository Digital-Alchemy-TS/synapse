import { TServiceParams } from "@digital-alchemy/core";

export function EntityGenerator({ synapse, context, logger }: TServiceParams) {
  synapse.sensor({
    context,
    defaultState: "home",
    name: "Location",
  });

  synapse.binary_sensor({
    context,
    defaultState: "off",
    name: "Smoke detector",
  });

  ["high", "medium", "low"].forEach(i =>
    synapse.scene({
      context,
      exec() {
        logger.info(`activate bedroom ${i}`);
      },
      name: `bedroom_${i}`,
    }),
  );
}
