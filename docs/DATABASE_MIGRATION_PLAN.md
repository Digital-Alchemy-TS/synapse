# Database Migration Plan: SQLite → Drizzle ORM

## Overview

This document outlines the migration plan from the current SQLite implementation using `better-sqlite3`/`bun:sqlite` with hand-written queries to Drizzle ORM with support for PostgreSQL and MySQL.

## Current Architecture Analysis

### Current Database Implementation

**Core Files:**
- `src/services/sqlite.service.mts` - Main database service
- `src/helpers/sqlite.mts` - SQL queries and types
- `src/services/locals.service.mts` - Local storage service
- `src/services/storage.service.mts` - Entity storage service

**Current Dependencies:**
- `better-sqlite3` (v11.10.0) - Primary SQLite driver
- `bun:sqlite` - Bun runtime SQLite driver (fallback)
- `@types/better-sqlite3` - TypeScript types

**Current Database Schema:**
1. `HomeAssistantEntity` table - Main entity storage
2. `HomeAssistantEntityLocals` table - Local entity data

## Migration Touch Points

### 1. Dependencies & Package Management ✅ COMPLETED

**Files to Update:**
- `package.json` ✅
- `yarn.lock` ✅

**Changes Required:**
- [x] Remove `better-sqlite3` and `@types/better-sqlite3`
- [x] Add `drizzle-orm` and database drivers:
  - `drizzle-orm` - Core ORM
  - `drizzle-kit` - Migration tooling
  - `postgres` - PostgreSQL driver
  - `mysql2` - MySQL driver
  - `@types/pg` - PostgreSQL types
- [x] Update peer dependencies
- [x] Add database-specific packages based on target databases

### 2. Configuration System ✅ COMPLETED

**Files to Update:**
- `src/synapse.module.mts` ✅

**Changes Required:**
- [x] Replace `SQLITE_DB` config with simple database configs:
  - `DATABASE_TYPE` - "sqlite" | "postgresql" | "mysql"
  - `DATABASE_URL` - Connection string (works for all database types)
- [x] Add database-specific configuration options
- [x] Update configuration validation

### 3. Database Schema Definition ✅ COMPLETED

**New Files to Create:**
- `src/schema/tables.mts` ✅ - Drizzle schema definitions
- `src/database/migrations/` - Migration files directory
- `drizzle.config.ts` ✅ - Drizzle configuration

**Changes Required:**
- [x] Convert SQL CREATE TABLE statements to Drizzle schema
- [x] Define proper TypeScript types for all tables
- [x] Add indexes and constraints
- [ ] Create migration scripts
- [ ] Handle database-specific features (e.g., PostgreSQL JSONB vs MySQL JSON)

### 4. Database Service Layer ✅ COMPLETED

**Files to Update:**
- `src/services/sqlite.service.mts` → `src/services/database.service.mts` ✅

**Changes Required:**
- [x] Replace SQLite-specific code with Drizzle ORM
- [x] Implement database connection pooling
- [x] Add database-specific query optimizations
- [x] Handle connection lifecycle (connect/disconnect)
- [x] Implement retry logic for connection failures
- [x] Add database health checks
- [x] Support for multiple database types

### 5. Query Migration

**Files to Update:**
- `src/helpers/sqlite.mts` → `src/database/queries.mts`
- `src/services/locals.service.mts`
- `src/services/storage.service.mts`

**Changes Required:**
- [ ] Convert all raw SQL queries to Drizzle ORM queries
- [ ] Replace `database.prepare()` calls with Drizzle query builders
- [ ] Update parameter binding syntax
- [ ] Handle database-specific SQL dialects
- [ ] Optimize queries for each database type
- [ ] Add proper error handling for database-specific errors

### 6. Type System Updates

**Files to Update:**
- `src/helpers/sqlite.mts`
- `src/database/types.mts` (new file)

**Changes Required:**
- [ ] Update `HomeAssistantEntityRow` type to use Drizzle-generated types
- [ ] Update `HomeAssistantEntityLocalRow` type
- [ ] Add database-specific type definitions
- [ ] Ensure type safety across all database operations

### 7. Testing Infrastructure

**Files to Update:**
- `src/test/` directory
- `src/mock/extensions/configuration.service.mts`
- `vitest.config.ts`

**Changes Required:**
- [ ] Update test database setup/teardown
- [ ] Add database-specific test configurations
- [ ] Create test utilities for each database type
- [ ] Update mock services to work with new database layer
- [ ] Add integration tests for each supported database

### 8. Migration Scripts

**New Files to Create:**
- `scripts/migrate-to-drizzle.mts` - Data migration script
- `scripts/setup-databases.mts` - Database setup script

**Changes Required:**
- [ ] Create data migration from SQLite to target databases
- [ ] Add database schema validation
- [ ] Create rollback procedures
- [ ] Add data integrity checks

### 9. Documentation Updates

**Files to Update:**
- `README.md`
- `docs/` directory

**Changes Required:**
- [ ] Update installation instructions
- [ ] Add database configuration examples
- [ ] Document migration procedures
- [ ] Add troubleshooting guides for each database type

### 10. Build & Deployment

**Files to Update:**
- `package.json` scripts
- CI/CD configuration

**Changes Required:**
- [ ] Add database setup scripts to build process
- [ ] Update deployment configurations
- [ ] Add database health checks to startup
- [ ] Update Docker configurations if applicable

## Implementation Phases

### Phase 1: Foundation (Week 1-2) ✅ COMPLETED
- [x] Set up Drizzle ORM and dependencies
- [x] Create database schema definitions
- [x] Implement basic database service with SQLite support
- [x] Update configuration system

### Phase 2: Core Migration (Week 3-4)
- [ ] Migrate all SQL queries to Drizzle ORM
- [ ] Update storage and locals services
- [ ] Implement database connection management
- [ ] Add comprehensive error handling

### Phase 3: Multi-Database Support (Week 5-6)
- [ ] Add PostgreSQL support
- [ ] Add MySQL support
- [ ] Implement database-specific optimizations
- [ ] Add database health checks

### Phase 4: Testing & Validation (Week 7-8)
- [ ] Update all tests
- [ ] Add integration tests for each database
- [ ] Performance testing and optimization
- [ ] Data migration testing

### Phase 5: Documentation & Deployment (Week 9-10)
- [ ] Update documentation
- [ ] Create migration guides
- [ ] Update deployment procedures
- [ ] Final testing and validation

## Database-Specific Considerations

### PostgreSQL
- **Advantages:** JSONB support, better performance for complex queries
- **Considerations:** Connection pooling, SSL configuration
- **Schema Changes:** Use JSONB instead of TEXT for JSON fields

### MySQL
- **Advantages:** Wide compatibility, good performance
- **Considerations:** JSON field limitations, connection limits
- **Schema Changes:** Use JSON type, handle MySQL-specific constraints

### SQLite (Legacy Support)
- **Advantages:** File-based, no server setup
- **Considerations:** Limited concurrent access, file locking
- **Schema Changes:** Minimal changes, maintain compatibility

## Risk Assessment

### High Risk
- Data migration process
- Breaking changes to existing APIs
- Performance regressions

### Medium Risk
- Database-specific bugs
- Configuration complexity
- Testing coverage gaps

### Low Risk
- Documentation updates
- Build process changes

## Success Criteria

- [ ] All existing functionality works with Drizzle ORM
- [ ] Support for PostgreSQL and MySQL databases
- [ ] No performance regressions
- [ ] Comprehensive test coverage
- [ ] Successful data migration from SQLite
- [ ] Updated documentation and migration guides
- [ ] Zero breaking changes to public APIs

## Rollback Plan

If issues arise during migration:
1. Maintain SQLite service as fallback
2. Feature flag to switch between old and new implementations
3. Automated rollback procedures
4. Data backup and restoration procedures

## Monitoring & Metrics

- [ ] Database connection health monitoring
- [ ] Query performance metrics
- [ ] Error rate tracking
- [ ] Migration success rate monitoring
- [ ] User adoption metrics

---

**Last Updated:** 2024-12-19
**Status:** Phase 1 Complete - Foundation Ready
**Next Review:** 2024-12-26
