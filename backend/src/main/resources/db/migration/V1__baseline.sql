-- V1: Baseline Migration
--
-- This migration serves as a baseline for an existing database.
-- We enabled spring.flyway.baseline-on-migrate=true, so Flyway
-- will accept the current schema as version 0 and start from here.
--
-- In a real-world scenario with an existing production database:
-- 1. You would export the current schema
-- 2. Put it here as V1
-- 3. Set baseline-version=1
--
-- For this project, we're starting fresh with performance improvements.
-- The actual schema is managed by JPA entities and validated by Hibernate.
--
-- NOTE: If setting up a fresh database, JPA will create the schema
-- on first run (with ddl-auto=validate, we trust existing schema).
-- Future migrations (V2+) will add indexes and optimizations.

-- Placeholder to satisfy Flyway's requirement for at least one migration
SELECT 1;
