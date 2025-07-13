import { defineConfig } from "drizzle-kit";

// Get database type from environment or default to sqlite
const databaseType = process.env.DATABASE_TYPE || "sqlite";

// Base configuration
const baseConfig = {
  schema: "./src/schema/*.mts",
  verbose: true,
  strict: true,
};

// Database-specific configurations
const configs = {
  sqlite: {
    ...baseConfig,
    dialect: "sqlite" as const,
    out: "./src/schema/migrations/sqlite",
    dbCredentials: {
      url: process.env.DATABASE_URL || "file:./synapse_storage.db",
    },
  },
  postgresql: {
    ...baseConfig,
    dialect: "postgresql" as const,
    out: "./src/schema/migrations/postgresql",
    dbCredentials: {
      url: process.env.DATABASE_URL || "postgresql://localhost:5432/synapse",
    },
  },
  mysql: {
    ...baseConfig,
    dialect: "mysql" as const,
    out: "./src/schema/migrations/mysql",
    dbCredentials: {
      url: process.env.DATABASE_URL || "mysql://localhost:3306/synapse",
    },
  },
};

// Export the appropriate configuration based on DATABASE_TYPE
export default defineConfig(configs[databaseType as keyof typeof configs] || configs.sqlite);
