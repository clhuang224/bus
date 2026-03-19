# Finding the Bus

A bus-focused single-page application for route lookup, nearby stops, and real-time transit information in Taiwan, designed for both desktop and mobile browsing.

## Screenshot

![demo](./demo.png)

## Features

### Route Search

Users can search bus routes by service area and keyword.

- The Routes page defaults to the area resolved from the user's current location.
- If the user manually changes the area, that selection is preserved while they continue browsing.
- Search keywords are also preserved when returning to the Routes page during the same session.
- Matching routes open a route detail page with subroute tabs, stop lists, and a synchronized map.

### Route Detail

The Route page combines stop-by-stop route browsing, map interaction, and real-time transit data.

- Official route shape data is used for more accurate route lines on the map when available.
- The stop list and map stay in sync: selecting a stop in one view updates the other.
- Real-time buses are displayed on both the route map and the stop timeline.
- The app shows real-time status messaging such as temporary data issues or non-operating service periods.

### Nearby Stops

The Nearby Stops page is based on the user's current GPS location.

- If location permission is granted, the app resolves the current city and service area automatically.
- Stops within **0.5 kilometers** are shown as both a list and map markers.
- Selecting a stop reveals stop details, including its city, address, and all serving routes.

If location permission is denied, the Nearby Stops feature becomes unavailable.

### Favorites

The Favorites page stores route-stop combinations for quick return access.

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

### Key Pages

- `app/pages/Favorite.tsx`: saved favorite route-stop combinations
- `app/pages/Routes.tsx`: route search flow
- `app/pages/Nearby.tsx`: nearby stop discovery using geolocation
- `app/pages/Route.tsx`: route detail and stop list view

### Key Data Flow

1. Route screens fetch data through `app/modules/apis/bus.ts`.
2. The API layer shapes external data into app-facing models.
3. Pages coordinate screen state and pass shaped data into feature components.
4. Shared app state such as favorites, geolocation, city geo data, and global modals is stored in Redux slices.

## Open Data

The project currently relies on two external open data sources:

### TDX Bus API

Base URL:

`https://tdx.transportdata.tw/api/basic/v2/Bus`

TDX, short for Transport Data eXchange, is Taiwan's transportation data platform. It provides standardized transport datasets and APIs, including bus routes, stops, and related transit data used by this project.

This project reaches TDX through a Cloudflare Worker proxy. The Worker holds the application-level `client_id` and `client_secret`, exchanges them for a bearer access token, and forwards authenticated TDX requests on behalf of the frontend.

Current endpoints used by the app:

| Method | Endpoint | Used For | Response Summary |
| --- | --- | --- | --- |
| `GET` | `/Route/City/:city` | Route search, route detail, and area-level route fan-out requests | Route-level data including subroutes, operators, departure stop names, and destination stop names |
| `GET` | `/StopOfRoute/City/:city` | Route detail and building stop-to-route relationships for nearby stops | Stops under each route plus subroute and direction-specific stop sequences |
| `GET` | `/Stop/City/:city` | Nearby page stop discovery and route map stop positions | Stop positions and metadata used to group nearby stops into stations |

In the actual implementation, these requests may include OData query parameters such as `$format=JSON`.

### Real-time Capacity Notes

Real-time data on the Route page currently uses two upstream TDX endpoints:

- `EstimatedTimeOfArrival`
- `RealTimeNearStop`

When the Route page is visible, the app polls those endpoints every 30 seconds. That means one actively viewed Route page generates about **4 requests per minute** under steady-state conditions.

With a paid plan that allows **5 requests per second per key**, the current request strategy is expected to comfortably support roughly **20 to 40 concurrent active Route-page users**, with a higher theoretical ceiling in steady-state conditions.

Actual capacity may be lower during bursty moments such as hard refreshes, reconnects, route changes, multiple open tabs, or upstream TDX instability. Real-time features should therefore be treated as a best-effort integration with the upstream provider rather than a strict availability guarantee.

The Cloudflare Worker proxy also emits structured request logs for operational visibility. Those logs can be used to inspect endpoint hit counts, response statuses, request latency, and whether a request had to retry after an upstream `401`.

### Taiwan County Boundaries

Boundary data is loaded from the counties dataset in [dkaoster/taiwan-atlas](https://github.com/dkaoster/taiwan-atlas):

`https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json`

The app converts that TopoJSON counties dataset into GeoJSON and uses it to determine which Taiwan city or county contains the user's current coordinates. That city lookup then drives:

- Nearby page area selection
- default route search area selection
- region-aware bus API requests based on the resolved county

## Development

This repository includes a Worker scaffold at `workers/tdx-proxy/`. To run the app locally:

### Install dependencies

```bash
pnpm install
```

### Set Environment Variables

1. Copy `workers/tdx-proxy/.dev.vars.example` to `workers/tdx-proxy/.dev.vars`.
2. Fill in `TDX_CLIENT_ID`, `TDX_CLIENT_SECRET`, and `TDX_ALLOWED_ORIGIN`.
3. The frontend is already pointed at the local Worker in `.env.development`:

```env
VITE_PROXY_API_BASE_URL=http://127.0.0.1:3000/api/tdx
```

### Run

Run local development with:

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

Production deployment uses this setup:

1. Store `TDX_CLIENT_ID`, `TDX_CLIENT_SECRET`, and `TDX_ALLOWED_ORIGIN` in Cloudflare Worker environment bindings.
2. Deploy the Worker with `pnpm run deploy:proxy`.
3. Store `VITE_PROXY_API_BASE_URL` as a GitHub Actions repository variable.
4. Let the GitHub Pages build inject that value during `pnpm run build`.

The frontend does not use a direct bearer-token fallback path. Both local development and public deployment are expected to route TDX traffic through the proxy.
