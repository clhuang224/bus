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

The generated Prisma Client is written to `src/generated/prisma` and is ignored by Git. Generate it before running TypeScript directly:

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

| Script | Description |
| --- | --- |
| `pnpm --filter @bus/api prisma:generate` | Generate the Prisma Client into `src/generated/prisma`. |
| `pnpm --filter @bus/api prisma:format` | Format Prisma schema files. |
| `pnpm --filter @bus/api prisma:validate` | Validate Prisma schema files. |
| `pnpm --filter @bus/api prisma:migrate:status` | Show the current migration status for the configured database. |
| `pnpm --filter @bus/api prisma:migrate:create -- --name add_example_table` | Create a reusable migration file without applying it. Requires a reachable database. |
| `pnpm --filter @bus/api prisma:migrate:dev` | Apply migrations locally during development. |
| `pnpm --filter @bus/api prisma:migrate:deploy` | Apply committed migrations in deployment. |
| `pnpm --filter @bus/api prisma:migrate:diff` | Preview SQL differences from committed migrations to the current schema. |
| `pnpm --filter @bus/api prisma:migrate:diff:empty` | Preview SQL for building the current schema from an empty database. |

Use `--output prisma/migrations/<timestamp>_<name>/migration.sql` with a diff script when intentionally writing SQL output to a migration file.

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
