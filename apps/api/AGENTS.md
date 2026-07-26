# API Guide

This workspace contains the NestJS backend API.

Use this guide for changes under `apps/api`. The current backend is still contract-first: endpoints may return empty arrays or minimal placeholder data until the database and sync flow are implemented.

## Structure

Keep API features grouped by domain module:

- `src/admin/`: admin-only sync endpoints such as `/api/admin/sync/routes`
- `src/favorite/`: favorite-related endpoints
- `src/realtime/`: polling or future realtime snapshot endpoints
- `src/routes/`: route list and route detail endpoints
- `src/settings/`: settings-related endpoints
- `src/stations/`: station and nearby station endpoints
- `src/dto/`: DTOs shared across API modules, such as localized text and positions

Each feature module should usually contain:

- `<feature>.module.ts`
- `<feature>.controller.ts`
- `<feature>.service.ts`
- `dto/*.dto.ts`

Do not place new feature endpoints directly in `app.controller.ts`. Keep `AppController` focused on system-level endpoints such as health checks.

## Routing

The API uses `app.setGlobalPrefix('api')`, so controller paths are written without the `/api` prefix.

Examples:

- `@Controller('routes')` becomes `/api/routes`
- `@Controller('stations')` becomes `/api/stations`
- `@Controller('admin/sync')` becomes `/api/admin/sync`

Use `:uuid` for route parameters instead of TDX-style names such as `:routeUid` or `:stopUid`.

## DTO Naming

Use kebab-case file names with `.dto.ts` suffix:

- `health-response.dto.ts`
- `routes-response.dto.ts`
- `route-realtime-response.dto.ts`

Use PascalCase class names:

- `HealthResponseDto`
- `RoutesResponseDto`
- `RouteRealtimeResponseDto`

Keep response fields in `snake_case`. Do not expose TDX field names such as `RouteUID`, `StopUID`, `StopName`, or `UpdateTime`.

Localized text objects are the exception to the `snake_case` rule. Use locale tags as keys:

- `zh-TW`
- `en`

Do not expose TDX localized text keys such as `Zh_tw` or `En`.

For a resource's own identifier, use `uuid`.

Prefer nested objects over prefixed identifier fields. For example:

- prefer `route.uuid`
- prefer `stop.uuid`
- avoid `route_uuid`
- avoid `stop_uuid`

Use full coordinate field names:

- `latitude`
- `longitude`

Avoid abbreviated coordinate names such as `lat` or `lon` in API responses.

Use the following coordinate shapes in API contracts:

- Single coordinate points use objects with explicit keys:
  `{ latitude: number, longitude: number }`.
- Ordered paths or geometry-like arrays use MapLibre/GeoJSON coordinate order:
  `[longitude, latitude][]`.
- Keep TDX-specific coordinate names and ordering inside TDX client, mapper, or
  sync code. Public API responses should not expose TDX coordinate field names.

## Response Contracts

All non-204 API responses use the shared response envelope:

- success: `{ status, message, data }`
- error: `{ status, error: { code, message } }`

Keep `ErrorCode` values in `packages/shared` and use a clear domain prefix. Use
`SYSTEM_*` for generic framework/system errors, such as validation failures,
missing authentication, or generic not-found responses. Add domain-specific
codes, such as `ROUTE_*`, only when the runtime can intentionally emit that
domain error.

OpenAPI/Scalar examples must match the real runtime response for their HTTP
status. Do not reuse a 404 `SYSTEM_NOT_FOUND` example for 400, 401, 403, 409,
or 500 responses.

Document common error responses globally instead of adding them to every
controller or endpoint. Endpoint-level error response decorators should be
reserved for domain-specific errors or other errors that the client may handle
differently for that endpoint. Keep the shared policy in
`docs/api-error-handling.md`.

Use ISO 8601 UTC strings from `Date#toISOString()` for public API timestamps
and OpenAPI/Scalar timestamp examples, such as
`2026-06-03T18:25:13.000Z`. Do not use timezone-offset examples such as
`+08:00` unless the endpoint intentionally returns that exact format.

Before adding a local test-only response type, check whether an existing DTO or
shared contract type already represents it. In e2e tests, prefer
`ApiSuccessResponse<SomeResponseDto>` or `ApiErrorResponse` from
`@bus/shared`, plus the actual API DTO from `src/**/dto`, instead of rewriting
the response envelope or DTO shape in the test file.

## Code Organization

Inside classes, keep methods in reading order. Public entry points should appear
before the private helpers they call, and related helper methods should stay
near the public method they support. Avoid putting mapper/helper methods above
the main flow unless that is already the local pattern in the file.

## Shared Types

Put cross-workspace enums and stable contract values in `packages/shared`.

Good fits:

- city enum
- route direction enum
- sync resource/status enum

Keep Nest-specific DTO classes in `apps/api`, because they use decorators such as `@ApiProperty`.

## ESM And Imports

`@bus/api` is an ESM package and uses `moduleResolution: "nodenext"`.

Use `.js` extensions for local relative imports:

```ts
import { RoutesService } from './routes.service.js'
```

Do not omit the extension in API source files.

## Prisma

Prisma schema files live under `prisma/` and may be split into `prisma/models/` and `prisma/enums/`.

The generated Prisma Client output is `src/generated/prisma`. It is ignored by Git. Do not edit generated Prisma files by hand.

Use these scripts instead of ad hoc Prisma commands:

```sh
pnpm --filter @bus/api prisma:generate
pnpm --filter @bus/api prisma:format
pnpm --filter @bus/api prisma:validate
pnpm --filter @bus/api prisma:migrate:status
```

For normal schema changes with a reachable database, create migrations with:

```sh
pnpm --filter @bus/api prisma:migrate:create -- --name describe_change
```

For the first schema-only migration or review-only SQL output, use:

```sh
pnpm --filter @bus/api prisma:migrate:diff:empty
```

Write diff output to `prisma/migrations/<timestamp>_<name>/migration.sql` only when intentionally creating a migration file.

Keep migration files committed. Keep generated Prisma Client files uncommitted.

Database e2e tests use the real PostgreSQL connection and should stay out of pre-push for now. Run them manually with:

```sh
pnpm --filter @bus/api test:e2e:db
```

Only add database e2e to automated hooks or CI after a stable isolated test database exists.

## TDX Sync

Design sync code for the TDX basic membership limits:

- 5 requests per minute per key
- 3 virtual points per month
- bus API charging reference:
  - 1,500 requests per point
  - 150MB per point

Do not rely on exact point math inside feature sync services. Sync must be designed as a batched, resumable process instead of a large burst of upstream requests.

Keep TDX request throttling inside `TdxClientService`. Feature sync services such as `RoutesSyncService` should describe what data to sync, while `TdxClientService` owns how quickly TDX may be called. Do not scatter sleep, retry, or rate-limit logic across individual sync services.

## Endpoint Stubs

Until database work starts, endpoints may return:

- empty arrays for list responses
- minimal valid objects for detail responses
- placeholder timestamps such as an empty string when no real data exists yet

Keep those placeholders type-safe and shaped exactly like the future response contract.

## Validation

Useful checks for this workspace:

```sh
pnpm --filter @bus/api format
pnpm --filter @bus/api lint
pnpm --filter @bus/api build
pnpm --filter @bus/api test
```

`test:e2e` may fail in restricted local sandboxes that disallow creating HTTP servers or sockets. Treat that as an environment limitation unless it also fails in normal local development or CI.
