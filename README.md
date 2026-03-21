# Finding the Bus

A bus-focused single-page application for route lookup, nearby stops, and real-time transit information in Taiwan.

## Screenshot

![demo](./demo.png)

## Features

### Route Search

Search bus routes by service area and keyword.

- The Routes page defaults to the area resolved from the user's current location.
- If the user manually changes the area, that selection is preserved while they continue browsing.
- Search keywords are also preserved when returning to the Routes page during the same session.
- Matching routes open a route detail page with subroute tabs, stop lists, and a synchronized map.

### Route Detail

The Route page combines stop lists, map interaction, and real-time transit data.

- Official route shape data is used for more accurate route lines on the map when available.
- The stop list and map stay in sync: selecting a stop in one view updates the other.
- Each stop shows the nearest estimated arrival when upstream ETA data is available.
- Real-time buses are displayed on both the route map and the stop timeline when live vehicle data is available.
- The app shows real-time status messaging such as temporary data issues or non-operating service periods.

### Nearby Stops

The Nearby Stops page uses the user's current GPS location.

- If location permission is granted, the app resolves the current city and service area automatically.
- Stops within **0.5 kilometers** are shown as both a list and map markers.
- Selecting a stop reveals stop details, including its city, address, and serving route badges.
- Opening a stop's route detail view shows the full route list grouped by direction.

If location permission is denied, the Nearby Stops feature becomes unavailable.

### Favorites

The Favorites page stores route-stop combinations for quick access.

- Each favorite keeps the route, subroute, direction, and a specific stop.
- Opening a favorite jumps back into the matching Route page and highlights the saved stop.

## Tech Stack

- **Framework:** React SPA with React Router v7
- **Language:** TypeScript
- **UI:** Mantine
- **State and Data:** Redux Toolkit and RTK Query
- **Maps:** MapLibre GL JS with CARTO raster tiles
- **API Proxy:** Cloudflare Workers
- **Worker Tooling:** Wrangler
- **Geospatial Utilities:** Turf.js
- **Testing:** Vitest and React Testing Library
- **Tooling:** Vite, ESLint, pnpm

## Project Structure

The app is organized around route-level pages, feature components, and shared domain modules.

```text
app/
├── components/
│   ├── common/        # Shared UI components
│   ├── favorite/      # Favorite feature components
│   ├── nearby/        # Nearby feature components
│   ├── routes/        # Route feature components
│   └── providers/     # App providers
├── modules/
│   ├── apis/          # RTK Query APIs
│   ├── consts/        # Constant maps and UI copy
│   ├── enums/         # Domain enums
│   ├── hooks/         # Reusable app hooks
│   ├── interfaces/    # Domain and API object models
│   ├── slices/        # Redux slices
│   ├── types/         # Shared type helpers
│   ├── utils/         # Shared helpers
│   └── store.ts       # Redux store
├── pages/             # Route page modules
├── root.tsx           # App root
└── routes.ts          # Route definitions

workers/
└── tdx-proxy/         # Cloudflare Worker proxy
```

## Open Data

The project relies on two external open data sources.

### TDX Bus API

Base URL:

`https://tdx.transportdata.tw/api/basic/v2/Bus`

TDX, short for Transport Data eXchange, provides the route, stop, realtime, and shape data used by this app. Requests go through a Cloudflare Worker proxy that handles TDX authentication for the frontend.

Current endpoints used by the app:

| Method | Endpoint | Used For | Response Summary |
| --- | --- | --- | --- |
| `GET` | `/Route/City/:city` | Route search, route detail, and area-level route fan-out requests | Route-level data including subroutes, operators, departure stop names, and destination stop names |
| `GET` | `/StopOfRoute/City/:city` | Route detail and building stop-to-route relationships for nearby stops | Stops under each route plus subroute and direction-specific stop sequences |
| `GET` | `/Stop/City/:city` | Nearby page stop discovery and route map stop positions | Stop positions and metadata used to group nearby stops into stations |
| `GET` | `/EstimatedTimeOfArrival/City/:city` | Route detail realtime ETA | Stop-level estimated arrival times and operating status |
| `GET` | `/RealTimeNearStop/City/:city` | Route detail realtime vehicles | Live vehicle positions and nearest stop information |
| `GET` | `/Shape/City/:city` | Route detail map path rendering | Official route geometry for map line rendering |

### Real-time Capacity Notes

The Route page polls `EstimatedTimeOfArrival` and `RealTimeNearStop` every 30 seconds while visible, so one active Route page generates about **4 requests per minute** under steady-state conditions.

The TDX bronze plan currently enforces a shared limit of **5 requests per second per key**. Because this app uses one proxy-backed key for all visitors, short bursts can still hit 429 responses during hard refreshes, reconnects, route changes, multiple open tabs, or periods with many concurrent users.

In practice, this means route realtime data should be treated as a best-effort feature rather than a strict availability guarantee. When the shared limit is hit, the app may temporarily show a message that realtime data is unavailable or that too many people are querying at the same time, then retry automatically after a short delay.

The Cloudflare Worker proxy also emits structured request logs for operational visibility.

### Taiwan County Boundaries

Boundary data comes from the counties dataset in [dkaoster/taiwan-atlas](https://github.com/dkaoster/taiwan-atlas):

`https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json`

The app converts that TopoJSON dataset into GeoJSON to determine the user's city and area for nearby-stop and route-search flows.

## Development

### Install dependencies

```bash
pnpm install
```

### Set environment variables

1. Copy `workers/tdx-proxy/.dev.vars.example` to `workers/tdx-proxy/.dev.vars`.
2. Fill in `TDX_CLIENT_ID`, `TDX_CLIENT_SECRET`, and `TDX_ALLOWED_ORIGINS`.
3. The frontend is already pointed at the local Worker in `.env.development`:

```env
VITE_PROXY_API_BASE_URL=http://127.0.0.1:3000/api/tdx
```

### Run locally

Start local development with:

```bash
pnpm run dev
```

This starts both the frontend dev server and the local Cloudflare Worker proxy.

### Test

```bash
pnpm run lint
pnpm run typecheck
pnpm test
```

## Deployment Notes

The frontend is deployed as a static app, while TDX authentication is handled by a separate Cloudflare Worker proxy.

1. Store `TDX_CLIENT_ID`, `TDX_CLIENT_SECRET`, and `TDX_ALLOWED_ORIGINS` in Cloudflare Worker environment bindings.
2. Deploy the Worker with `pnpm run deploy:proxy`.
3. Store `VITE_PROXY_API_BASE_URL` as a GitHub Actions repository variable.
4. Let the GitHub Pages build inject that value during `pnpm run build`.
