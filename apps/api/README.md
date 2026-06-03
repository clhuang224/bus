# FTB API

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
