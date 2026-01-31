# Postgres Migration Summary

Since Convex free limits were exceeded, we migrated to a self-hosted PostgreSQL setup.

## 1. Infrastructure (Docker)
- Started Postgres 16 container via `docker run`.
- Port: `5432`.
- Credentials: `buckbuckgo` / `postgres`.
- Database: `buckbuckgo`.
- Volume: `buckbuckgo_postgres_data`.

## 2. Schema
- Created `documents` table with `searchable_text` (TEXT) and `GIN` index.
- Applied via `infra/postgres/init-scripts/init.sql`.

## 3. Crawler (`apps/crawler`)
- Ported "Convex Storage" to "Postgres Storage" using `sqlx`.
- Implemented `NepaliNlp` (suffix stemming) in Rust (`src/stemmer.rs`) to process text before insertion.
- Updated `config.rs` to default to Postgres URL.
- **Verification**: Crawler ran and inserted ~1200 documents.

## 4. Search API (`apps/search-api`)
- Updated `SearchLive.ts` to use `pg` driver.
- Updated SQL query to use `to_tsvector('simple', ...)` and `plainto_tsquery`.
- **Status**: API is running but returning 500 (Effect Runtime Error). Debugging required on `SearchService` yielding.

## Next Steps
1. Debug `apps/search-api/src/index.ts` or `SearchLive.ts` dependency injection.
2. Ensure `apps/web` points to `localhost:4000`.
3. Use `docker-compose` for orchestration (requires installing docker-compose plugin).
