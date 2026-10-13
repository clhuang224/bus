# Development Plan

## Overview

The production app is still the frontend on GitHub Pages, which calls TDX through the Cloudflare Worker proxy for both base data and realtime data. That approach is hard to scale: every visitor spends the shared TDX key's quota, and the frontend has to compose raw TDX data itself.

A NestJS backend with a PostgreSQL database now runs locally. It syncs TDX base data into the database, serves route and station data from it, and serves cached TDX realtime snapshots. The web app can read from it in local API mode. The remaining work is to move realtime data in the web app onto the API, deploy the API, and switch production to it.

## Primary Goal

Reduce direct TDX usage by moving common route and stop flows to app-owned data.

The long-term aim is to run on the free TDX membership. See [TDX Quota](#tdx-quota) for what fits it today.

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

Responsibilities:

- TDX authentication
- scheduled or manual base-data sync
- route and station API endpoints backed by the database
- realtime snapshots fetched from TDX and cached briefly in memory
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

Realtime data is not stored in the database. The API fetches it from TDX per route and caches each snapshot in memory for 90 seconds.

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

Deploy the NestJS backend to a long-running host such as Render and use a
managed PostgreSQL database. The current local workflow uses Prisma Postgres;
choose and document the production database provider before deployment.

Do not deploy the sync worker to a serverless platform. It resumes background
sync runs and may run for an extended period. Run a single API instance, since
the realtime cache and rate limiter live in memory.

Once the API is deployed and the web app reads all data from it, retire the
TDX proxy. Until then, the proxy is required by production and shares the TDX
key with the API.

## Current State

### API Endpoints

Application endpoints are prefixed with `/api`.

| Method | Endpoint                     | Description                                       |
| ------ | ---------------------------- | ------------------------------------------------- |
| GET    | `/api/health`                | Health check                                      |
| GET    | `/api/routes?area=...`       | Route list for one search area, from the database |
| GET    | `/api/routes/:uuid`          | Route detail with sub-routes, stops, and shapes   |
| GET    | `/api/stations`              | Nearby stations with their routes                 |
| GET    | `/api/realtime/routes/:uuid` | Realtime snapshot for one route, from TDX         |
| POST   | `/api/admin/sync/routes`     | Queue a route sync from TDX                       |
| POST   | `/api/admin/sync/stops`      | Queue a stop sync from TDX                        |
| GET    | `/api/admin/sync/runs`       | List recent sync runs                             |
| GET    | `/api/admin/sync/runs/:uuid` | Get one sync run with city progress               |

Favorite and settings endpoints exist only as contract placeholders; see
[Backlog](#backlog).

### Progress

- The monorepo, NestJS API, Scalar documentation, Prisma schema, and initial migrations are in place.
- Route sync runs in the background, records TDX requests, protects the basic-member quota, and resumes by city checkpoint.
- Route sync currently covers all supported cities and soft-deactivates routes and subroutes missing from the latest city response.
- Stop sync persists station groups, stations, stops, route stops, and fallback route shapes.
- Full stop sync has been validated across Taiwan, but database usage and storage should continue to be monitored.
- Public route and nearby station endpoints read from the database.
- In local API mode, the Nearby, Routes, and Route pages read base data from
  the database API; default and production web builds still use the TDX
  proxy.
- The web app chooses the data source in one place, `transitApi`, so pages and
  hooks consume the same app-facing models in either mode.
- The web app still reads realtime ETA, near-stop, and vehicle position data
  from TDX in every mode. Route detail responses include TDX references
  (`SubRouteUID`, `StopID`, and `StationID`) so the web app can match that
  realtime data and keep saved favorite IDs stable.
- The API serves `GET /api/realtime/routes/:uuid`. It fetches one route's
  realtime feeds from TDX, caches them briefly in memory, and returns what each
  sub-route should show, keyed by app UUIDs. The web app does not use it yet.

## Next Steps

1. Switch the Route page's realtime data to `GET /api/realtime/routes/:uuid`
   in local API mode through `transitApi`, so the page renders the API's
   arrival and status values instead of matching TDX records itself. After
   that, favorites are the only reason route detail still carries TDX
   references.
2. Prepare API deployment as its own change. Choose the long-running host and
   managed PostgreSQL provider, configure production CORS and secrets, apply
   committed Prisma migrations, and decide where the protected monthly sync
   job will run. The realtime cache lives in memory, so run one API instance.
3. After the public API is deployed, switch production web builds to the
   database API and validate that route search, route detail, shapes, realtime,
   and locale fallback match the TDX-backed experience. Watch for sub-route
   tab order: the API orders sub-routes by direction, while TDX keeps upstream
   order.

### Realtime Open Questions

The API realtime rules are ported from the Route page and keep its behavior
in these cases. Decide whether to change them before or after the web app
switches to the API:

- **ETAs with an unknown direction.** TDX can tag ETAs with direction `255`.
  They match no sub-route and are ignored. On Tainan route 黃幹線, this left
  20 of 67 stops on the full-length sub-route without the not-yet-departed
  countdown that TDX provided. They could be used when their `SubRouteUID`
  matches.
- **Short-trip sub-routes without their own ETAs.** When TDX has no ETAs for
  a sub-route, it falls back to route-level ETAs, which can show another
  sub-route's buses. Tainan's 白河→柳營奇美醫院 short trip showed ETAs from
  the full-length 黃幹線.
- **Vehicles at a last-bus-passed stop.** A vehicle arriving at a stop whose
  ETA reports the last bus has passed shows that status, as seen on Penghu
  route 21.

The API also fixes a Route page issue: a sub-route that visits the same stop
twice shows the first visit's ETA on both rows in the web app, while the API
matches each visit by sequence. This affects about 5% of active sub-routes
and goes away when the web app uses the realtime API.

### TDX Quota

The project aims to run on the free TDX basic membership (5 requests per
minute per key, 3 points per month: 1,500 requests or 150MB per point) and
currently uses the bronze membership (5 requests per second, 200 points per
month).

- Base-data sync fits the free tier. One route and stop sync used about 100
  requests and 175MB of decompressed responses in October 2026.
- Realtime data does not fit the free tier through TDX. Each refresh needs
  three requests (ETA, near-stop, and GPS), and TDX offers no endpoint that
  combines them, so 5 requests per minute serves about two routes at a time
  across all users.
- Production web builds still call TDX for base data through the proxy, so
  the free tier also requires the production switch to the database API.
- City open-data feeds are the candidate path to free realtime data. Taipei
  publishes a citywide ETA file without an API key, updated about every 20
  seconds. Before building on such feeds, check each city's update rate,
  identifiers, license, and access limits, and whether they report whether a
  vehicle is arriving at or leaving a stop.

## Backlog

These features should wait until the base backend/database flow is stable and the product has a clearer account/auth direction:

- account/auth system
- favorites API
- settings API
- a shared realtime cache, such as Redis, if the API ever needs more than one instance
- SSE or WebSocket delivery

Favorites and settings should remain frontend-local for now. Backend-owned favorites and settings only become useful after login exists, because their main value is syncing user-specific state across devices.
