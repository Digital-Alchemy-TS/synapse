import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/*.mts",
  out: "./src/schema/migrations",
  dialect: "sqlite", // Default dialect, can be overridden per environment
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./synapse_storage.db",
  },
  verbose: true,
  strict: true,
});
