# FTB API

[English](./README.md) | [繁體中文](./docs/README.zh-TW.md)

NestJS backend workspace for Finding the Bus.

The API is currently contract-first: endpoints and DTOs are shaped for the planned frontend/backend split before database sync and upstream TDX integration are implemented.

## Local Development

Run the API workspace from the repository root:

```bash
pnpm --filter @bus/api start:dev
```

The development server uses port `3000` by default.

Local development scripts:

| Script                                     | Description                                                     |
| ------------------------------------------ | --------------------------------------------------------------- |
| `pnpm --filter @bus/api start:dev`         | Start the API in watch mode.                                    |
| `pnpm --filter @bus/api start:dev:awake`   | Start the API in watch mode and prevent idle sleep on macOS.    |
| `pnpm --filter @bus/api sync:routes:local` | Queue a route sync through the API running on `localhost:3000`. |
| `pnpm --filter @bus/api sync:stops:local`  | Queue a stop sync through the API running on `localhost:3000`.  |

Use `start:dev:awake` for long local sync runs on macOS. Keep the regular `start:dev` command for cross-platform development and deployment environments.

Limit local sync runs with `SYNC_CITIES` when testing large sync flows:

```bash
SYNC_CITIES=Taipei pnpm --filter @bus/api start:dev:awake
```

Use TDX city names such as `Taipei` and `NewTaipei`, separated by commas.

### Route Sync

A full route sync processes all 22 cities sequentially. One local run against a remote PostgreSQL database took approximately one hour; actual duration depends on database latency and the amount of TDX data.

Progress is checkpointed by city. If a run is interrupted, retrying the failed run skips cities that already succeeded and resumes from the first incomplete city.

### Stop Sync

Stop sync is much larger than route sync. A single major city can include tens of thousands of stops and route-stop rows. Prefer testing with `SYNC_CITIES` before running a full 22-city stop sync, especially on free database plans.

Progress logs are grouped by stage and report roughly ten times per stage so large imports remain visible without flooding logs.

## API Documentation

Scalar renders the generated OpenAPI document:

- Scalar reference: `http://localhost:3000/reference`
- OpenAPI JSON: `http://localhost:3000/openapi-json`
- Swagger UI fallback: `http://localhost:3000/openapi`

Application endpoints are prefixed with `/api`.

## Testing

- unit tests live next to source files under `src/`
- e2e tests live under `test/` and should be grouped by API resource, such as `health.e2e-spec.ts` or `routes.e2e-spec.ts`
- shared e2e app bootstrap belongs in `test/create-e2e-app.ts` so global prefix and future global setup stay consistent across suites

## Prisma

Prisma schema files live under `prisma/`.

The generated Prisma Client is written to `src/generated/prisma` and is ignored by Git. The `start:dev`, `test`, and `typecheck` scripts run `prisma:generate` automatically. If you invoke TypeScript tooling directly outside of these scripts, generate the client first:

```bash
pnpm --filter @bus/api prisma:generate
```

### Database URL

Create a local environment file from the example file:

```bash
cp apps/api/.env.example apps/api/.env.local
```

Set `DATABASE_URL` in `apps/api/.env.local`.

You can get a PostgreSQL connection string from the database provider dashboard. For the current Prisma Postgres workflow, create or open the database project, copy the pooled PostgreSQL connection string, and paste it into `DATABASE_URL`.

Keep the real connection string only in local or deployment environment variables.

After setting `DATABASE_URL`, apply migrations before testing database-backed endpoints:

```bash
pnpm --filter @bus/api prisma:migrate:dev
```

Useful Prisma scripts:

| Script                                                                     | Description                                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm --filter @bus/api format`                                            | Format all source files and Prisma schema files.                                     |
| `pnpm --filter @bus/api prisma:generate`                                   | Generate the Prisma Client into `src/generated/prisma`.                              |
| `pnpm --filter @bus/api prisma:format`                                     | Format Prisma schema files.                                                          |
| `pnpm --filter @bus/api prisma:validate`                                   | Validate Prisma schema files.                                                        |
| `pnpm --filter @bus/api prisma:migrate:status`                             | Show the current migration status for the configured database.                       |
| `pnpm --filter @bus/api prisma:migrate:create -- --name add_example_table` | Create a reusable migration file without applying it. Requires a reachable database. |
| `pnpm --filter @bus/api prisma:migrate:dev`                                | Apply migrations locally during development.                                         |
| `pnpm --filter @bus/api prisma:migrate:deploy`                             | Apply committed migrations in deployment.                                            |
| `pnpm --filter @bus/api prisma:migrate:diff`                               | Preview SQL differences from committed migrations to the current schema.             |
| `pnpm --filter @bus/api prisma:migrate:diff:empty`                         | Preview SQL for building the current schema from an empty database.                  |

Use `--output prisma/migrations/<timestamp>_<name>/migration.sql` with a diff script when intentionally writing SQL output to a migration file.

## Database E2E

Database e2e tests exercise the real PostgreSQL connection. They require `DATABASE_URL` and applied migrations, and they may create temporary rows.

Run them manually when checking database-backed flows:

```bash
pnpm --filter @bus/api test:e2e:db
```

Do not add database e2e tests to pre-push yet. Keep them manual until there is a stable test database or a dedicated CI job with isolated credentials.

## Endpoint Groups

- `system`: service health checks
- `routes`: route list and route detail contracts
- `stations`: station and nearby station contracts
- `realtime`: polling-friendly realtime snapshot contracts
- `admin`: base-data sync entry points

## Backlog Endpoint Groups

These groups are contract placeholders and should wait for account/auth work before becoming part of the first backend scope:

- `favorite`: account-based favorite route and stop contracts
- `settings`: account-based settings sync contracts

## Planned Responsibilities

- TDX authentication and upstream request shaping
- base-data sync into PostgreSQL
- route and station API endpoints backed by the database
- request pacing and TDX quota protection
- Scalar/OpenAPI documentation

See [docs/plan.md](../../docs/plan.md) for the current backend migration plan.
