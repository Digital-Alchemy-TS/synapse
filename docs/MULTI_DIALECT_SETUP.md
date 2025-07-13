# Multi-Dialect Database Support

This library supports SQLite, PostgreSQL, and MySQL databases using Drizzle ORM. Here's how to set it up and use it.

## Overview

**You do NOT need to generate migrations multiple times** for different dialects. Drizzle generates dialect-specific SQL from the same schema definition.

## Schema Files

We use separate schema files for each dialect to ensure proper type safety and dialect-specific features:

- `src/schema/tables.mts` - SQLite schema (default)
- `src/schema/tables.postgresql.mts` - PostgreSQL schema
- `src/schema/tables.mysql.mts` - MySQL schema

## Configuration

### Environment Variables

Set the database type and connection URL:

```bash
# For SQLite (default)
DATABASE_TYPE=sqlite
DATABASE_URL=file:./synapse_storage.db

# For PostgreSQL
DATABASE_TYPE=postgresql
DATABASE_URL=postgresql://username:password@localhost:5432/synapse

# For MySQL
DATABASE_TYPE=mysql
DATABASE_URL=mysql://username:password@localhost:3306/synapse
```

### Drizzle Configuration

The `drizzle.config.ts` automatically selects the appropriate configuration based on `DATABASE_TYPE`:

```typescript
// drizzle.config.ts
const databaseType = process.env.DATABASE_TYPE || "sqlite";

const configs = {
  sqlite: {
    dialect: "sqlite",
    out: "./src/schema/migrations/sqlite",
    // ... other config
  },
  postgresql: {
    dialect: "postgresql",
    out: "./src/schema/migrations/postgresql",
    // ... other config
  },
  mysql: {
    dialect: "mysql",
    out: "./src/schema/migrations/mysql",
    // ... other config
  },
};

export default defineConfig(configs[databaseType] || configs.sqlite);
```

## Generating Migrations

### For All Dialects

```bash
# Generate migrations for current DATABASE_TYPE
npm run db:generate

# Or generate for specific dialects
npm run db:generate:sqlite
npm run db:generate:postgresql
npm run db:generate:mysql
```

### Migration Output

Migrations are generated in separate directories:

```
src/schema/migrations/
├── sqlite/          # SQLite migrations
├── postgresql/      # PostgreSQL migrations
└── mysql/           # MySQL migrations
```

## Database-Specific Features

### PostgreSQL
- **JSONB support**: Uses `jsonb` type for JSON fields
- **Native timestamps**: Uses `timestamp` type with `defaultNow()`
- **Better performance**: For complex queries and JSON operations

### MySQL
- **VARCHAR with lengths**: Specified lengths for string fields
- **Native timestamps**: Uses `timestamp` type with `defaultNow()`
- **Wide compatibility**: Good for existing MySQL infrastructure

### SQLite
- **Text for JSON**: Uses `text` type for JSON fields
- **Text for timestamps**: Uses `text` with `CURRENT_TIMESTAMP` default
- **File-based**: No server setup required

## Usage in Your Application

### 1. Set Database Type

```typescript
// In your environment or config
process.env.DATABASE_TYPE = "postgresql"; // or "mysql", "sqlite"
process.env.DATABASE_URL = "postgresql://localhost:5432/myapp";
```

### 2. Import Schema

The schema is automatically selected based on `DATABASE_TYPE`:

```typescript
import { homeAssistantEntity, homeAssistantEntityLocals } from "./schema/tables.mts";
```

### 3. Database Service

The database service will automatically use the correct dialect:

```typescript
// src/services/database.service.mts
if (config.synapse.DATABASE_TYPE === "postgresql") {
  // PostgreSQL connection logic
} else if (config.synapse.DATABASE_TYPE === "mysql") {
  // MySQL connection logic
} else {
  // SQLite connection logic (default)
}
```

## Migration Workflow

### 1. Schema Changes

When you modify the schema:

1. Update the appropriate schema file(s)
2. Generate migrations for each dialect you support:

```bash
npm run db:generate:sqlite
npm run db:generate:postgresql
npm run db:generate:mysql
```

### 2. Apply Migrations

```bash
# Apply migrations for current DATABASE_TYPE
npm run db:migrate
```

### 3. Review Generated SQL

Each dialect generates different SQL:

**SQLite:**
```sql
CREATE TABLE "HomeAssistantEntity" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "state_json" TEXT NOT NULL,
  -- ...
);
```

**PostgreSQL:**
```sql
CREATE TABLE "HomeAssistantEntity" (
  "id" SERIAL PRIMARY KEY,
  "state_json" JSONB NOT NULL,
  -- ...
);
```

**MySQL:**
```sql
CREATE TABLE `HomeAssistantEntity` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `state_json` VARCHAR(1000) NOT NULL,
  -- ...
);
```

## Best Practices

### 1. Test All Dialects

Always test your schema changes with all supported dialects:

```bash
# Test SQLite
DATABASE_TYPE=sqlite npm run db:generate && npm run db:migrate

# Test PostgreSQL
DATABASE_TYPE=postgresql npm run db:generate && npm run db:migrate

# Test MySQL
DATABASE_TYPE=mysql npm run db:generate && npm run db:migrate
```

### 2. CI/CD Integration

Add dialect testing to your CI pipeline:

```yaml
# .github/workflows/test-databases.yml
- name: Test SQLite
  run: DATABASE_TYPE=sqlite npm run test

- name: Test PostgreSQL
  run: DATABASE_TYPE=postgresql npm run test

- name: Test MySQL
  run: DATABASE_TYPE=mysql npm run test
```

### 3. Schema Consistency

Keep schema files in sync by:
- Using the same table and column names
- Maintaining consistent constraints
- Testing with all dialects before merging

## Troubleshooting

### Common Issues

1. **Migration conflicts**: Each dialect has separate migration history
2. **Type mismatches**: Ensure schema files are consistent
3. **Connection issues**: Verify `DATABASE_URL` format for each dialect

### Debugging

```bash
# Check current configuration
echo $DATABASE_TYPE
echo $DATABASE_URL

# Generate with verbose output
drizzle-kit generate --verbose

# Check migration status
drizzle-kit studio
```

## Summary

- **One schema definition** works for all dialects
- **Separate migration directories** for each dialect
- **Environment-based configuration** for easy switching
- **Dialect-specific optimizations** (JSONB, timestamps, etc.)
- **Consistent API** across all database types

This approach gives you the flexibility to support multiple databases while maintaining a clean, maintainable codebase.
