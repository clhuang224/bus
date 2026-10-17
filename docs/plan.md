# Development Plan

[English](./plan.md) | [繁體中文](./plan.zh-TW.md)

## Overview

Only the frontend is deployed to production, on GitHub Pages, and it calls the TDX API through the Cloudflare Worker proxy for both base data and realtime data. This fit the early work, which focused on exploring the frontend framework. But the approach has unavoidable drawbacks: every visitor spends the shared TDX key's quota, and the frontend has to compose raw TDX data itself.

A NestJS backend with a PostgreSQL database can now run locally. It syncs TDX base data into the database, serves route and station data from it, and serves cached TDX realtime snapshots. The web app can read from it in local API mode. The remaining work is to move realtime data in the web app onto the API, deploy the API, and switch production to it.

## Goals

- Reduce direct TDX usage by moving common route and stop flows to app-owned data. The backend should not be only a proxy: it stores non-realtime base data, and the frontend depends on it for common route and stop flows.
- Run on the free TDX membership in the long term. See [TDX Quota](#tdx-quota) for what fits it today.

## Architecture

### Monorepo

```txt
apps/
  web/        React Router frontend
  tdx-proxy/  Cloudflare Worker proxy for TDX authentication
  api/        NestJS backend
packages/
  shared/     shared API contracts, enums, and TDX upstream types
```

The shared package stays small and only contains contracts that are truly shared between frontend and backend. Nest-specific DTO classes stay in the API workspace.

### Backend

The NestJS API is responsible for:

- TDX authentication
- scheduled or manual base-data sync
- route and station endpoints backed by the database
- realtime snapshots fetched from TDX and cached briefly in memory
- request shaping and response DTOs
- TDX quota protection

API documentation uses Scalar with OpenAPI, and grows together with the endpoints.

### Database

The API uses PostgreSQL with Prisma. The Prisma schema in `apps/api/prisma/models/` is the source of truth for tables, columns, and indexes, and `apps/api/AGENTS.md` holds the naming and type rules. This section records the decisions behind the schema.

The schema covers base data (routes, sub-routes, operators, station groups, stations, stops, route stops, and route shapes) and sync bookkeeping. Models for vehicles, users, favorites, and settings exist, but nothing uses them yet.

```mermaid
erDiagram
  sync_run ||--o{ sync_run_city : checkpoints
  sync_run ||--o{ sync_error : has
  sync_run ||--o{ tdx_request_log : records

  route ||--o{ subroute : has
  route ||--o{ route_operator : has
  operator ||--o{ route_operator : operates

  subroute ||--o{ route_stop : has
  subroute ||--o| route_shape : has

  station_group ||--o{ station : contains
  station ||--o{ stop : groups
  stop ||--o{ route_stop : appears_in

  user ||--o{ favorite_route_stop : owns
  route ||--o{ favorite_route_stop : references
  subroute ||--o{ favorite_route_stop : references
  stop ||--o{ favorite_route_stop : references
  user ||--o| user_setting : owns
```

Decisions:

- **Stations, not stop signs, for nearby flows.** TDX separates station groups, stations, and stops, so the schema keeps three tables. A stop is one physical sign and is what `route_stop` points to. `station.station_group_id` and `stop.station_id` are nullable because station data is incomplete in some cities. The nearby endpoint returns page-ready stations, so the frontend does not need to know which TDX resources built them.
- **Identifiers.** Public `uuid` values come from TDX: a route's is its `RouteUID`, a stop's is its `StopUID`, a station's is its `StationUID`, and a sub-route's is `<SubRouteUID>-<Direction>`, since one TDX sub-route can run in both directions. Raw TDX IDs that other data refers to are kept in `tdx_*` columns, such as `tdx_subroute_uid` and `tdx_stop_id`.
- **Route stops are ordered by `sequence`.** A sub-route can visit the same stop more than once, so `route_stop` is unique by sub-route and sequence, not by stop.
- **No `area` column.** The API maps a search area to its cities when querying.
- **Route shapes are stored as readable paths.** `route_shape.path` holds `[longitude, latitude]` pairs, and `source` records whether it came from an encoded polyline, a geometry, or stop positions. When TDX has no usable shape, the path is built from ordered stop positions.
- **No PostGIS for now.** Nearby search uses plain latitude and longitude columns with bounding boxes and precise distance. PostGIS can wait until spatial queries need it.
- **English addresses are translated, not synced.** TDX only provides Chinese addresses. Sync keeps `address_en` while `address_zh_tw` is unchanged, and clears it when the Chinese address changes.
- **Realtime data is not stored.** The API caches realtime snapshots in memory; see [Realtime](#realtime).
- **Base data is soft-deleted.** Favorites may reference routes and stops, so records missing from the latest TDX response are marked inactive instead of deleted, and are reactivated if they come back. Favorite rows themselves can be deleted.

### Base-Data Sync

- An admin endpoint creates a `sync_run` and returns at once. A background service runs the sync, so the HTTP request does not stay open while all cities sync.
- Route and stop syncs process the supported cities one at a time and record a `sync_run_city` checkpoint for each. A retried run skips completed cities. Sync writes are idempotent, so a city that was interrupted can run again.
- Sync services describe what to fetch; the sync TDX client owns pacing and quota. It writes one `tdx_request_log` row per request and checks the minute and month quota against those rows before each request, using a PostgreSQL advisory lock so API instances share one count.
- When the quota is exhausted for now, the run becomes `pending` with a `resume_after_at` time. Unexpected errors mark the run `failed`.
- Mappers are split by boundary: TDX to database records close to Prisma fields, and database records to API responses close to page-ready contracts.
- `records_*` counters use the sync resource as their unit; a route run counts route rows, not sub-route or operator writes.
- A monthly cadence is enough, because base route and stop data change rarely.

See `apps/api/docs/sync-troubleshooting.md` for failures seen so far.

### Realtime

`GET /api/realtime/routes/:uuid` fetches one route's ETA, near-stop, and GPS feeds from TDX when asked, and returns what each sub-route should show. Each route's snapshot is cached in memory for 90 seconds, or 5 seconds after a failed feed, and concurrent requests share one fetch. A separate realtime TDX client limits itself to 3 requests per second by default, leaving headroom on the shared key for sync and the proxy.

### Deployment

Keep the frontend on GitHub Pages.

Deploy the NestJS backend to a long-running host such as Render with a managed PostgreSQL database. Local development uses Prisma Postgres; choose and document the production database provider before deployment.

Do not deploy the sync worker to a serverless platform: it resumes background sync runs and may run for a long time. Run a single API instance, since the realtime cache and rate limiter live in memory.

Before deployment:

- confirm the PostgreSQL and hosting projects, and how the API connects to the database
- set environment variables in the host, keeping only placeholders in `.env.example`
- decide how committed Prisma migrations run against the production database
- protect the admin sync endpoints before they can change data
- decide where the scheduled monthly sync runs

Once the API is deployed and the web app reads all data from it, retire the TDX proxy. Until then, production needs the proxy, and it shares the TDX key with the API.

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

Notes:

- Route detail includes TDX references (each sub-route's `SubRouteUID`, and each stop's `StopID` and `StationID`) so the web app can match TDX realtime data and keep saved favorite IDs stable.
- Nearby stations always correspond to a station record. Stops without a station are left out until their product behavior is decided. Station addresses merge the station's and its stops' addresses per language.
- In local API mode, the Nearby page stores station UUIDs in its URL. Selection URLs from TDX mode are not translated.
- Favorite and settings endpoints exist only as contract placeholders; see [Backlog](#backlog).

### Progress

- The monorepo, NestJS API, Scalar documentation, Prisma schema, and migrations are in place.
- Route and stop sync run in the background across all supported cities, record TDX requests, protect the quota, resume by city checkpoint, and soft-deactivate records missing upstream. Full syncs have been validated across Taiwan, most recently in October 2026.
- Sync runs can be inspected through the admin sync run endpoints.
- In local API mode, the Nearby, Routes, and Route pages read base data from the database API; default and production web builds still use the TDX proxy.
- The web app chooses the data source in one place, `transitApi`, so pages and hooks consume the same app-facing models in either mode.
- The API serves realtime snapshots keyed by app UUIDs. The web app still reads realtime data from TDX in every mode.

### Storage

Observed on 2026-10-13, after the October route and stop syncs. Sizes come from `pg_size_pretty`, which uses binary units.

- total database size: about 191 MiB, up from about 148 MB on 2026-07-10
- Prisma Free storage limit reference: 512 MiB

| Table            | Estimated rows | Total size | Table data | Indexes | Notes                                                               |
| ---------------- | -------------: | ---------: | ---------: | ------: | ------------------------------------------------------------------- |
| `route_stop`     |        244,063 |     83 MiB |     33 MiB |  49 MiB | Largest table; indexes are larger than row data.                    |
| `stop`           |        136,965 |     60 MiB |     34 MiB |  26 MiB | Main stop sync table.                                               |
| `station`        |         52,163 |     18 MiB |    9.9 MiB | 8.4 MiB | Station data is not available for every city.                       |
| `route_shape`    |          6,141 |     11 MiB |     11 MiB | 656 KiB | Shared by route detail rendering and stop-position fallback shapes. |
| `subroute`       |          7,049 |    4.7 MiB |    2.9 MiB | 1.7 MiB | Route direction and variant rows.                                   |
| `station_group`  |          6,684 |    2.7 MiB |    1.6 MiB | 1.1 MiB | Optional because TDX support differs by city.                       |
| `route`          |          3,139 |    1.2 MiB |    768 KiB | 440 KiB | Route list data.                                                    |
| `route_operator` |          3,115 |    528 KiB |    208 KiB | 288 KiB | Route/operator join rows.                                           |

Stop-related tables take about 164 MiB, route-related tables about 6.5 MiB, route shapes about 11 MiB, and sync bookkeeping less than 1 MiB. Tables for later features are empty but still hold a little metadata.

Since July, row counts grew about 4% while the database grew about 30%. Inactive rows are few (for example, 334 of about 244,000 route stops), so most of the growth is likely space left by sync rewriting rows, which autovacuum marks reusable but does not return. Check whether the size keeps growing after future syncs.

## Next Steps

1. Switch the Route page's realtime data to `GET /api/realtime/routes/:uuid` in local API mode through `transitApi`, so the page renders the API's arrival and status values instead of matching TDX records itself. After that, favorites are the only reason route detail still carries TDX references.
2. Deploy the API as its own change, following the checklist in [Deployment](#deployment).
3. After the public API is deployed, switch production web builds to the database API and validate that route search, route detail, shapes, realtime, and locale fallback match the TDX-backed experience. Watch for sub-route tab order: the API orders sub-routes by direction, while TDX keeps upstream order.

### Realtime Open Questions

The API realtime rules are ported from the Route page and keep its behavior in these cases. Decide whether to change them before or after the web app switches to the API:

- **ETAs with an unknown direction.** TDX can tag ETAs with direction `255`. They match no sub-route and are ignored. On Tainan route 黃幹線, this left 20 of 67 stops on the full-length sub-route without the not-yet-departed countdown that TDX provided. They could be used when their `SubRouteUID` matches.
- **Short-trip sub-routes without their own ETAs.** When TDX has no ETAs for a sub-route, it falls back to route-level ETAs, which can show another sub-route's buses. Tainan's 白河→柳營奇美醫院 short trip showed ETAs from the full-length 黃幹線.
- **Vehicles at a last-bus-passed stop.** A vehicle arriving at a stop whose ETA reports the last bus has passed shows that status, as seen on Penghu route 21.

The API also fixes a Route page issue: a sub-route that visits the same stop twice shows the first visit's ETA on both rows in the web app, while the API matches each visit by sequence. This affects about 5% of active sub-routes and goes away when the web app uses the realtime API.

### TDX Quota

The project aims to run on the free TDX basic membership (5 requests per minute per key, 3 points per month: 1,500 requests or 150MB per point) and currently uses the bronze membership (5 requests per second, 200 points per month).

- Base-data sync fits the free tier. One route and stop sync used about 100 requests and 175MB of decompressed responses in October 2026.
- Realtime data does not fit the free tier through TDX. Each refresh needs three requests (ETA, near-stop, and GPS), and TDX offers no endpoint that combines them, so 5 requests per minute serves about two routes at a time across all users.
- Production web builds still call TDX for base data through the proxy, so the free tier also requires the production switch to the database API.
- City open-data feeds are the candidate path to free realtime data. Taipei publishes a citywide ETA file without an API key, updated about every 20 seconds. Before building on such feeds, check each city's update rate, identifiers, license, and access limits, and whether they report whether a vehicle is arriving at or leaving a stop.

### Product Name

The working name, Finding the Bus (FTB), is a deliberate pun on Finding Nemo. The joke may not land with every user, and it does not say what the app does, so the project needs a proper name before wider release.

A good name should:

- say or hint that the app is about Taiwan buses: route search, arrival times, and nearby stops
- work in both Traditional Chinese and English, since the app supports both
- be short and easy to say, type, and search for
- not clash with existing bus apps or services in Taiwan
- have a usable domain or subdomain; the app currently lives at `bus.lynns.me`

Where the name appears today:

- user-facing: the web app title (`app.name` in both locale files), the root READMEs, and the API documentation title in `apps/api/src/main.ts`
- docs: the opening line of `AGENTS.md`, the web and API READMEs, and the `FTB API` titles
- code and infrastructure: the `FTBError` class in the API, and the Worker name `finding-the-bus-tdx-proxy`; renaming the Worker changes its URL, so the web build's `VITE_PROXY_API_BASE_URL` must change with it
- names that can stay as they are: the `@bus/*` package scope and the `bus` repository

Steps:

1. Collect candidate names in Chinese and English.
2. Check each against existing apps, search results, and domain availability.
3. Decide the Chinese and English names and record them here.
4. Rename user-facing text and docs in one change. Rename code identifiers and the Worker separately, since the Worker rename is a deployment change.

## Backlog

These wait until the backend is deployed and stable:

- **Account and auth.** Favorites and settings stay frontend-local until login exists, because backend-owned favorites and settings are mainly useful for syncing across devices. The favorites and settings APIs follow auth.
- **Stop-level lookup endpoint**, if route pages need it.
- **Admin manager.** A separate `apps/manager` workspace for sync operations: list runs and their status, show city checkpoints, TDX request usage, and sync errors, and trigger or retry a run. Keep it read-only apart from explicit sync actions, and protect every route before exposing it. Until then, use Prisma Studio and logs.
- **A shared realtime cache**, such as Redis, if the API ever needs more than one instance.
- **SSE or WebSocket delivery** for realtime data.
