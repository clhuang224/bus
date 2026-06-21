# Development Plan

## Overview

The project currently works as a frontend-only MVP. As the app grows, direct and proxy-based TDX requests are becoming harder to scale because rate-limit pressure is increasing and the frontend is responsible for too much data composition.

The next direction is to introduce a backend and database layer so most user actions read from app-owned data instead of directly consuming TDX quota.

## Primary Goal

Reduce direct TDX usage by moving common route and stop flows to app-owned data.

The backend should not be only a proxy. The main goal is to store non-realtime base data and make the frontend depend on the app database for common route and stop flows.

## Architecture Direction

### Monorepo

The project uses a pnpm workspace:

```txt
apps/
  web/
  tdx-proxy/
  api/
packages/
  shared/
```

- `apps/web`: existing React Router frontend
- `apps/tdx-proxy`: existing Cloudflare Worker proxy for TDX authentication
- `apps/api`: new NestJS backend
- `packages/shared`: shared API contracts and domain types

The shared package should stay small and only contain contracts that are truly shared between frontend and backend, such as enums, interfaces, and pure type helpers. Nest-specific DTO classes stay in the API workspace.

### Backend

Use NestJS for the backend API.

Initial responsibilities:

- TDX authentication
- scheduled or manual base-data sync
- route and station API endpoints backed by the database
- request shaping and response DTOs
- TDX quota protection

### Database

Use PostgreSQL with Prisma.

The first database scope should focus on non-realtime base data:

- routes
- stations
- station groups
- stops
- route stops
- sync runs

Realtime data can be added later as cached snapshots after the base-data flow is stable.

Nearby station data should be modeled around stations, not only physical stop signs.

The backend should evaluate TDX station-oriented endpoints as primary sync sources for nearby flows:

- `/v2/Bus/Station/City/{City}`
- `/v2/Bus/StationGroup/City/{City}`

`/v2/Bus/Stop/City/{City}` and `/v2/Bus/StopOfRoute/City/{City}` are still useful for resolving physical stop signs, route directions, stop sequences, and route membership. The frontend should receive a page-ready station model and should not need to know whether the backend used station, station group, stop, or stop-of-route upstream data to compose it.

### API Documentation

Use Scalar with OpenAPI for API documentation.

The first version can keep the OpenAPI contract simple and grow it together with the backend endpoints.

### Deployment

Keep the frontend on GitHub Pages.

Deploy the NestJS backend to Render and use Neon PostgreSQL as the hosted database.

## Phase 1 Scope

The first phase should prove that the app can read core route and station data from its own backend/database.

### API Draft

| Method | Endpoint                 | Description                   |
| ------ | ------------------------ | ----------------------------- |
| GET    | `/api/health`            | Health check                  |
| GET    | `/api/routes`            | List routes from the database |
| GET    | `/api/routes/:uuid`      | Get route detail data         |
| GET    | `/api/stations`          | Find nearby station groups    |
| POST   | `/api/admin/sync/routes` | Sync route data from TDX      |
| POST   | `/api/admin/sync/stops`  | Sync stop data from TDX       |

### Current Progress

- The monorepo, NestJS API, Scalar documentation, Prisma schema, and initial migrations are in place.
- Route sync runs in the background, records TDX requests, protects the basic-member quota, and resumes by city checkpoint.
- Route sync currently covers all supported cities and soft-deactivates routes and subroutes missing from the latest city response.
- Stop, station, station group, and route-stop sync is the next base-data milestone.
- Public route and station endpoints still need to read from the database.

## Backlog

These features should wait until the base backend/database flow is stable and the product has a clearer account/auth direction:

- account/auth system
- favorites API
- settings API
- realtime ETA cache
- realtime vehicle snapshots
- SSE or WebSocket delivery

Favorites and settings should remain frontend-local for now. Backend-owned favorites and settings only become useful after login exists, because their main value is syncing user-specific state across devices.
