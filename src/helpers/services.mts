export type SynapseServiceParams = Record<string, unknown>;

type Target = {
  entity: {
    domain: string;
    supported_features: string[];
  };
};

type EntityFilterSelector = {
  integration: string;
  domain: string;
  device_class: string;
  supported_features: string[];
};

type DeviceFilterSelector = {
  integration: string;
  manufacturer: string;
  model: string;
  model_id: string;
};

type LegacyEntitySelector = {
  integration?: string;
  domain?: string[];
  device_class?: string[];
  supported_features: string[];
};

type LegacyDeviceSelector = {
  integration?: string;
  manufacturer?: string;
  model?: string;
};
// @SELECTORS.register("location")
// @SELECTORS.register("media")
// @SELECTORS.register("object")
// @SELECTORS.register("qr_code")
// @SELECTORS.register("target")

// @SELECTORS.register("trigger")
type Selectors = {
  action: {
    selector: {
      action: {
        // ?? nothing listed
        // """Selector of an action sequence (script syntax)."""
      };
    };
  };
  addon: {
    selector: {
      addon: {
        name?: string;
        slug?: string;
      };
    };
  };
  area: {
    selector: {
      area: {
        device?: DeviceFilterSelector[];
        entity?: EntityFilterSelector[];
        multiple?: boolean;
      };
    };
  };
  attribute: {
    selector: {
      entity_id: string;
      hide_attributes?: string[];
    };
  };
  assist_pipeline: {
    selector: {
      assist_pipeline: {
        // nothing
      };
    };
  };
  backup_location: {
    selector: {
      backup_location: {
        // none
      };
    };
  };
  boolean: {
    default?: boolean;
    selector: {
      boolean: {
        // none
      };
    };
  };
  color_rgb: {
    example: "[255, 100, 100]";
    selector: {
      color_rgb: {
        // multiple?: boolean;
      };
    };
  };
  color_temp: {
    selector: {
      color_temp: {
        unit?: "kelvin" | "mired";
        min?: number;
        max?: number;
        max_mireds?: number;
        min_mireds?: number;
      };
    };
  };
  config_entry: {
    advanced: true;
    example?: string;
    selector: {
      config_entry: {
        // multiple?: boolean;
        integration: string;
      };
    };
  };
  constant: {
    selector: {
      label?: string;
      value: string | number | boolean;
      translation_key?: string;
    };
  };
  conversation_agent: {
    selector: {
      conversation_agent: {
        language?: string;
      };
    };
  };
  country: {
    selector: {
      country: {
        countries?: string[];
        no_sort?: boolean;
      };
    };
  };
  date: {
    selector: {
      date: {
        // multiple: boolean;
      };
    };
  };
  datetime: {
    example?: string;
    default?: string;
    selector: {
      datetime: {
        // multiple?: boolean;
      };
    };
  };
  device: {
    selector: {
      device: LegacyDeviceSelector & {
        multiple?: boolean;
        filter?: DeviceFilterSelector[];
        entity?: EntityFilterSelector[];
      };
    };
  };
  duration: {
    selector: {
      duration: {
        enable_day?: boolean;
        enable_millisecond?: boolean;
        allow_negative?: boolean;
      };
    };
  };
  entity: {
    default?: string;
    selector: {
      entity: LegacyEntitySelector & {
        exclude_entities: string[];
        include_entities: string[];
        multiple?: boolean;
        reorder?: boolean;
        filter: EntityFilterSelector[];
      };
    };
  };
  file: {
    selector: {
      file: {
        accept: string;
      };
    };
  };
  floor: {
    selector: {
      entity?: EntityFilterSelector[];
      device?: DeviceFilterSelector[];
      multiple?: boolean;
    };
  };
  icon: {
    selector: {
      icon: {
        placeholder?: string;
      };
    };
  };
  label: {
    selector: {
      multiple?: boolean;
    };
  };
  language: {
    selector: {
      language: {
        languages?: string[];
        native_name?: boolean;
        no_sort?: boolean;
      };
    };
  };
  location: {
    // ??? Look at this again
    selector: {
      location: {
        radius?: boolean;
        icon?: string;
      };
    };
  };
  media: {
    selector: {
      media: {
        accept: string[];
      };
    };
  };
  number: {
    default?: number;
    selector: {
      number: {
        // multiple?: boolean;
        min?: number;
        max?: number;
        mode?: "box" | "slider";
        translation_key?: string;
        step?: number | "any";
        unit_of_measurement?: string;
      };
    };
  };
  object: {
    example: string;
    default?: string;
    selector: {
      object: {
        label_field?: string;
        description_field?: string;
        translation_key?: string;
        multiple?: boolean;
        // fields?: recursive
      };
    };
  };
  qr_code: {
    selector: {
      qr_code: {
        data: string;
        scale?: number;
        error_correction_level?: unknown;
      };
    };
  };
  select: {
    default?: string;
    example: string;
    selector: {
      select: {
        custom_value: boolean;
        multiple?: boolean;
        options: string[] | { label: string; value: string }[];
        mode?: "dropdown" | "list";
        translation_key: string;
      };
    };
  };
  state: {
    selector: {
      state: {
        multiple?: boolean;
        hide_states?: string[];
        entity_id?: string;
      };
    };
  };
  statistic: {
    selector: {
      statistic: {
        multiple?: true;
      };
    };
  };
  target: {
    selector: {
      target: {
        entity?: EntityFilterSelector[];
        device?: DeviceFilterSelector[];
      };
    };
  };
  template: {
    selector: {
      template: {
        //
      };
    };
  };
  text: {
    example?: string;
    default?: string;
    selector: {
      text: {
        type?:
          | "color"
          | "date"
          | "datetime-local"
          | "email"
          | "month"
          | "number"
          | "password"
          | "search"
          | "tel"
          | "text"
          | "time"
          | "url"
          | "week";
        autocomplete: string;
        multiline?: boolean;
        prefix?: string;
        suffix?: string;
        multiple?: boolean;
      };
    };
  };
  theme: {
    selector: {
      theme: {
        include_default?: boolean;
      };
    };
  };
  time: {
    example?: string;
    default?: string;
    selector: {
      time: {
        //
      };
    };
  };
  trigger: {
    selector: {
      trigger: {
        //
      };
    };
  };
};

type SynapseServiceField = {
  name?: string;
  advanced: true;
  description?: string;
  filter: {
    // notify integration has this?
    supported_features: string[];
  };
  required?: boolean;
};
