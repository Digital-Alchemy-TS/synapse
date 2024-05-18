import { is, TServiceParams } from "@digital-alchemy/core";

export function Configure({ lifecycle, config, internal }: TServiceParams) {
  lifecycle.onPreInit(() => {
    if (is.empty(config.synapse.METADATA_NAME)) {
      internal.boilerplate.configuration.set(
        "synapse",
        "METADATA_NAME",
        internal.boot.application.name,
      );
    }
  });
}
