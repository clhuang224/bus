# Shared Package

This package contains shared contracts between workspaces.

## Intended Scope

Good fits:

- API request and response DTOs
- domain enums shared by frontend and backend
- small pure type helpers
- stable interfaces that describe app-owned API contracts
- TDX upstream record types used by the API or the web app
- pure logic that the API and the web app must run identically, such as turning TDX realtime feeds into route realtime results

Avoid putting these here:

- React components
- Redux or RTK Query code
- NestJS services or controllers
- Prisma models as direct frontend contracts
- i18n copy
- localStorage helpers
- backend sync logic

The shared package should stay small and act as a contract layer, not a general utility bucket.

## Layout

- `src/types/`: app-owned API contracts, such as `ApiRouteDetail`, `ApiStation`, and `ApiRouteRealtime`, plus the response envelope
- `src/types/tdx/`: TDX upstream record types, such as `TdxBusRoute` and `TdxEstimatedArrival`. Keep them separate from the app contracts, and do not expose their field names in API responses
- `src/enums/`: enums used by both sides, including API status values and TDX value enums such as `TdxStopStatus`
- `src/constants/` and `src/utils/`: small shared lookups and pure helpers, such as the area-to-city mapping and `getEnumValues`
- `src/realtime/`: `calculateRouteRealtime` and the TDX realtime record checks. The API runs them on its TDX responses, and the web app runs them while it still calls TDX directly, so both sources follow the same rules

`src/types/` only exports types, so enums with runtime values belong in `src/enums/`.

## Validation

Tests use Vitest and sit next to the code as `*.test.ts`. The build leaves them out through `tsconfig.build.json`.

```sh
pnpm --filter @bus/shared lint
pnpm --filter @bus/shared typecheck
pnpm --filter @bus/shared test
```
