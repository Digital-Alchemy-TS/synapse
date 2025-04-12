import { Config } from "drizzle-kit";

export default {
  schema: "./schema.ts",
//   out: "./migrations",
//   driver: "turso",
//   dbCredentials: {
//     url: 'file:./local.db',
//   },
//   // Print all statements
//   verbose: true,
//   // Always ask for my confirmation
//   strict: true,
} satisfies Config;
