[![stars](https://img.shields.io/github/stars/Digital-Alchemy-TS/synapse)](https://github.com/Digital-Alchemy-TS/synapse)
![discord](https://img.shields.io/discord/1219758743848489147?label=Discord&logo=discord)

[![codecov](https://codecov.io/github/Digital-Alchemy-TS/synapse/graph/badge.svg?token=IBGLY3RY68)](https://codecov.io/github/Digital-Alchemy-TS/synapse)
[![version](https://img.shields.io/github/package-json/version/Digital-Alchemy-TS/synapse)](https://www.npmjs.com/package/@digital-alchemy/synapse)
---

## 📘 Description

Welcome to `@digital-alchemy/synapse`!

This project builds on the functions provided by `@digital-alchemy/hass` to provide the ability to generate entities within your Home Assistant install. With the help of a [custom component](https://github.com/Digital-Alchemy-TS/synapse-extension), you can gate logic behind switches, report states with sensors, attach functions to buttons, and more!

- [Extended docs](https://docs.digital-alchemy.app)

## 💾 Install

You can install the custom component through HACS. See the repo for more detailed install instructions of the component: https://github.com/Digital-Alchemy-TS/synapse-extension

This library can be installed as a simple dependency
```bash
npm i @digital-alchemy/synapse @digital-alchemy/hass
```

Then add to your application / library

```typescript
import { LIB_SYNAPSE } from "@digital-alchemy/synapse";
import { LIB_HASS } from "@digital-alchemy/hass";

// application
const MY_APP = CreateApplication({
  libraries: [LIB_SYNAPSE, LIB_HASS],
  name: "home_automation",
})

// library
export const MY_LIBRARY = CreateLibrary({
  depends: [LIB_SYNAPSE, LIB_HASS],
  name: "special_logic",
})
```

## 🛠️ Operation

Creating new entities with the library is easy! The library will automatically handle communication with Home Assistant, reporting values, and attaching callbacks

```typescript
import { CronExpression, TServiceParams } from "@digital-alchemy/core";
import { faker } from "@faker-js/faker";

export function Example({ scheduler, context, synapse }: TServiceParams) {
  // create a new switch entity
  const useHacker = synapse.switch({ context, name: "Use hacker phrase" });
  // create a new sensor entity
  const sensor = synapse.sensor({ context, name: "Current catchphrase" });

  // create a new phrase
  // taking into consideration the current state of the switch
  const regenerate = () => {
    sensor.storage.set(
      "state",
      useHacker.state === "on"
        ? faker.hacker.phrase()
        : faker.company.catchPhrase()
    );
  };

  // update sensor every 10 minutes
  scheduler.cron({
    exec: regenerate,
    schedule: CronExpression.EVERY_10_MINUTES,
  });

  // provide a button for immediate updates
  synapse.button({
    context,
    exec: regenerate,
    name: "Update phrase",
  });
}
```

## 🤝 Related Projects

| GitHub                                                              | Description                                                                            | NPM                                                                                      |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [automation](https://github.com/Digital-Alchemy-TS/automation)      | Advanced automation tools for creating dynamic workflows.                              | [@digital-alchemy/automation](https://www.npmjs.com/package/@digital-alchemy/automation) |
| [type-writer](https://github.com/Digital-Alchemy-TS/terminal)       | Generate custom type definitions for your setup.                                       | [@digital-alchemy/type-writer](https://www.npmjs.com/package/@digital-alchemy/terminal)  |
| [automation-template](https://github.com/Digital-Alchemy-TS/gotify) | Start your own Home Automation project with the `@digital-alchemy` quick start template|                                                                                          |
