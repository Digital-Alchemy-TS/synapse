import { TServiceParams } from "@digital-alchemy/core";

import {
  ImageConfiguration,
  isBaseEntityKeys,
  SynapseImageParams,
  SynapseVirtualImage,
  TRegistry,
  VIRTUAL_ENTITY_BASE_KEYS,
} from "../..";

export function VirtualImage({ context, synapse }: TServiceParams) {
  const registry = synapse.registry.create<SynapseVirtualImage>({
    context,
    // @ts-expect-error its fine
    domain: "image",
  });

  return function create<ATTRIBUTES extends object = object>(
    entity: SynapseImageParams,
  ) {
    const proxy = new Proxy({} as SynapseVirtualImage, {
      // #MARK: get
      get(_, property: keyof SynapseVirtualImage) {
        // > common
        if (isBaseEntityKeys(property)) {
          return loader.baseGet(property);
        }
        return undefined;
      },

      ownKeys: () => [...VIRTUAL_ENTITY_BASE_KEYS],

      // #MARK: set
      set(_, property: string, value: unknown) {
        // > common
        // * attributes
        if (property === "attributes") {
          loader.setAttributes(value as ATTRIBUTES);
          return true;
        }
        return false;
      },
    });

    // - Add to registry
    const unique_id = registry.add(proxy, entity);

    // - Initialize value storage
    const loader = synapse.storage.wrapper<
      never,
      ATTRIBUTES,
      ImageConfiguration
    >({
      name: entity.name,
      registry: registry as TRegistry<unknown>,
      unique_id,
    });

    // - Done
    return proxy;
  };
}
