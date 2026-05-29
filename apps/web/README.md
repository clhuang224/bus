# Web App

This workspace contains the React Router frontend for Finding the Bus.

## Features

### Route Search

Search bus routes by service area and keyword.

- The Routes page defaults to the area resolved from the user's current location.
- If the user manually changes the area, that selection is preserved across revisits.
- When the search box is empty, the page shows recently viewed routes when available for quick access.
- Matching routes open a route detail page with subroute tabs, stop lists, and a synchronized map.

### Route Detail

The Route page combines stop lists, map interaction, and real-time transit data.

- Official route shape data is used for more accurate route lines on the map when available.
- The stop list and map stay in sync: selecting a stop in one view updates the other.
- Stops can open Google Maps navigation from the stop list, and the route map includes a control to focus back on the user's current location.
- Each stop shows stop-level ETA based directly on `EstimatedTimeOfArrival` when upstream ETA data is available.
- Real-time vehicle plates are shown as separate location cues in the stop list and do not define the stop ETA.
- Route map vehicle markers use live GPS coordinates from `RealTimeByFrequency` when upstream realtime position data is available.
- The app shows real-time status messaging such as temporary data issues or non-operating service periods.

### Nearby Stops

The Nearby Stops page uses the user's current GPS location.

- If location permission is granted, the app resolves the current city and service area automatically.
- Stops within **0.5 kilometers** are shown as both a list and map markers.
- Selecting a stop reveals stop details, including its distance, city, address, and serving route badges.
- Stop details can open Google Maps navigation directly.
- Opening a stop's route detail view shows the full route list grouped by direction.

If location permission is denied, the Nearby Stops feature becomes unavailable.

### Favorites

The Favorites page stores route-stop combinations for quick access.

- Each favorite keeps the route, subroute, direction, and a specific stop.
- Opening a favorite jumps back into the matching Route page and highlights the saved stop.

### Language Settings

The app currently supports both `zh-TW` and `en`.

- Users can switch the interface language from the Settings page.
- The selected language is saved in local storage and restored on the next visit.
- Static UI copy comes from shared translation resources.
- API-backed route, subroute, stop, departure, and destination text follows the active locale, preferring English when available and falling back to `zh-TW` when English data is missing.

## Tech Stack

- **Framework:** React SPA with React Router v7
- **Language:** TypeScript
- **UI:** Mantine
- **State and Data:** Redux Toolkit and RTK Query
- **Maps:** MapLibre GL JS with OpenFreeMap tiles
- **Geospatial Utilities:** Turf.js
- **Testing:** Vitest and React Testing Library
- **Tooling:** Vite and ESLint

## Structure

```text
apps/web/
├── app/
│   ├── components/        # Shared and feature UI
│   ├── modules/           # APIs, store, hooks, models, i18n, and utilities
│   ├── pages/             # Favorite, Routes, Nearby, Route, and Settings pages
│   ├── test/              # Shared test setup and render helpers
│   ├── root.tsx           # App root
│   └── routes.ts          # Route definitions
├── public/                # Static assets
├── react-router.config.ts
├── vite.config.ts
└── vitest.config.ts
```

## Open Data

### TDX Bus API

`https://tdx.transportdata.tw/api/basic/v2/Bus`

TDX, short for Transport Data eXchange, provides the route, stop, realtime, and shape data used by this app. Frontend requests go through the `@bus/tdx-proxy` Cloudflare Worker, which handles TDX authentication.

Current endpoint usage:

| Endpoint | Used For |
| --- | --- |
| `/Route/City/:city` | route search and route detail |
| `/StopOfRoute/City/:city` | route stop lists and nearby route relationships |
| `/Stop/City/:city` | nearby stop discovery and map stop positions |
| `/EstimatedTimeOfArrival/City/:city` | stop-level ETA |
| `/RealTimeNearStop/City/:city` | stop-list vehicle cues and near-stop status |
| `/RealTimeByFrequency/City/:city` | route map vehicle GPS positions |
| `/Shape/City/:city` | route map path rendering |

Realtime data is best-effort and may be temporarily unavailable when the shared proxy-backed key hits upstream rate limits.

### Taiwan County Boundaries

Boundary data comes from the counties dataset in [dkaoster/taiwan-atlas](https://github.com/dkaoster/taiwan-atlas):

`https://cdn.jsdelivr.net/npm/taiwan-atlas/counties-10t.json`

The project vendors that TopoJSON dataset as a local static asset and converts it into GeoJSON at runtime to determine the user's city and area for nearby-stop and route-search flows.

## Development

Run frontend-only commands from the repository root:

```bash
pnpm --filter @bus/web lint
pnpm --filter @bus/web typecheck
pnpm --filter @bus/web test
```

Build the frontend with the proxy base URL provided:

```bash
VITE_PROXY_API_BASE_URL=/api/tdx pnpm --filter @bus/web build
```

For full local development with the proxy, use the root command:

```bash
pnpm run dev
```
