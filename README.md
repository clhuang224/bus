# Finding the Bus

A bus-focused single-page application for route lookup, nearby stops, and real-time transit information in Taiwan.

## Screenshot

![demo](./demo.png)

## Tech Stack

- **Framework:** React (SPA)
- **Language:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v7
- **UI Library:** Mantine
- **State Management:** Redux Toolkit
- **Data fetching:** RTK Query
- **Map Engine:** MapLibre GL JS
- **Basemap Provider:** CARTO (raster tiles)
- **Geospatial Analysis:** Turf.js
- **Testing:** Vitest + React Testing Library
- **Linting:** ESLint
- **Package Manager:** pnpm

## Application Flow

### App Initialization

On first launch, the app requests geolocation permission.

- If granted, the current GPS coordinates are stored.
- The app determines the user's city and area from those coordinates.
- If denied, the "Nearby Stops" feature becomes unavailable.

### Nearby Stops

The Nearby Stops page is based on the user's current GPS location.

If permission is granted:

- The app determines the current city from the GPS coordinates.
- It maps that city to a service area and fetches stop data for that area.
- Stops within **0.5 kilometers** are displayed both as a list and as map markers.
- Clicking a stop opens the stop detail panel, showing:
  - The stop's city and address
  - All routes serving the stop

### Route Search

Users can search routes within the currently selected region.

- Route numbers can be entered using a custom bus keypad or the native keyboard.
- Matching routes are displayed as a list.
- Clicking a route opens the **Route Page**, which shows:
  - Subroute tabs for each available direction or variant
  - All stops along the active subroute
  - The route path and stop markers on the map

### Route Favorites

The Favorites page displays saved route-stop combinations.

- Each favorite stores a route, subroute, direction, and a specific stop.
- Clicking a favorite opens the matching **Route Page**.

## Current Status

Work in progress.

## Project Structure

The app is organized around route-level pages, reusable feature components, and shared domain modules.

```text
app/
├── components/
│   ├── common/               # Shared UI components
│   ├── favorite/             # Favorite feature components
│   ├── nearby/               # Nearby feature components
│   ├── routes/               # Route feature components
│   └── providers/            # App providers
├── modules/
│   ├── apis/                 # RTK Query APIs
│   ├── consts/               # Constant maps
│   ├── enums/                # Domain enums
│   ├── hooks/                # Reusable app hooks
│   ├── interfaces/           # Domain interfaces
│   ├── slices/               # Redux slices
│   ├── types/                # Shared types
│   ├── utils/                # Shared helpers
│   └── store.ts              # Redux store
├── pages/                    # Route pages
├── root.tsx                  # App root
└── routes.ts                 # Route config
```

### Key Pages

- `app/pages/Favorite.tsx`: saved favorite route-stop combinations
- `app/pages/Routes.tsx`: route search flow
- `app/pages/Nearby.tsx`: nearby stop discovery using geolocation
- `app/pages/Route.tsx`: route detail and stop list view

### Key Data Flow

1. Route screens fetch data through `app/modules/apis/bus.ts`.
2. Raw TDX fields are transformed into app-facing models in the API layer.
3. Pages coordinate screen state and pass shaped data into feature components.
4. Shared app state such as favorites, geolocation, city geo data, and global modals is stored in Redux slices.

## APIs In Use

The project currently uses the TDX Bus API base URL:

`https://tdx.transportdata.tw/api/basic/v2/Bus`

TDX, short for Transport Data eXchange, is Taiwan's transportation data platform. It provides standardized transport datasets and APIs, including bus routes, stops, and related transit data used by this project.

This project currently reaches TDX through a Cloudflare Worker proxy. The Worker holds the application-level `client_id` and `client_secret`, exchanges them for a bearer access token, and forwards authenticated TDX requests on behalf of the frontend.

Current endpoints used by the app:

| Method | Endpoint | Used For | Response Summary |
| --- | --- | --- | --- |
| `GET` | `/Route/City/:city` | Route search, route detail, and area-level route fan-out requests | Route-level data including subroutes, operators, departure stop names, and destination stop names |
| `GET` | `/StopOfRoute/City/:city` | Route detail and building stop-to-route relationships for nearby stops | Stops under each route plus subroute and direction-specific stop sequences |
| `GET` | `/Stop/City/:city` | Nearby page stop discovery and route map stop positions | Stop positions and metadata used to group nearby stops into stations |

In the actual implementation, these requests may include OData query parameters such as `$format=JSON`.

### API Model Notes

- API access is centralized in `app/modules/apis/bus.ts`.
- Raw TDX localized fields such as `Zh_tw` and `En` are transformed into app-localized objects like `{ zh_TW, en }`.
- Nearby stop route data is further shaped into view models such as `NearbyStopGroup` and `StationRoute`.
- Area-level requests are implemented by fan-out to multiple city endpoints and merged in the API layer.

## Development

### Local Development Proxy

Local development uses the bundled Cloudflare Worker proxy instead of a frontend bearer token.

This repository includes a Worker scaffold at `workers/tdx-proxy/`.

Suggested local setup:

1. Install dependencies with `pnpm install`.
2. Copy `workers/tdx-proxy/.dev.vars.example` to `workers/tdx-proxy/.dev.vars`.
3. Fill in `TDX_CLIENT_ID`, `TDX_CLIENT_SECRET`, and `TDX_ALLOWED_ORIGIN`.
4. The frontend already points to the local Worker in `.env.development`:

```env
VITE_PROXY_API_BASE_URL=http://127.0.0.1:3000/api/tdx
```

5. Run local development with:

```bash
pnpm run dev
```

This starts both the frontend dev server and the local Cloudflare Worker proxy.

### Cloudflare Worker Proxy (recommended for public deployment)

For public deployment, keep the frontend static and move TDX authentication behind a thin Cloudflare Worker proxy so the frontend no longer exposes a bearer token.

In production, the Worker should be deployed separately and the frontend should point at the deployed proxy URL through GitHub Actions build-time configuration.

The current deployment design is:

1. Store `TDX_CLIENT_ID`, `TDX_CLIENT_SECRET`, and `TDX_ALLOWED_ORIGIN` in Cloudflare Worker environment bindings.
2. Deploy the Worker with `pnpm run deploy:proxy`.
3. Store `VITE_PROXY_API_BASE_URL` as a GitHub Actions repository variable.
4. Let the GitHub Pages build inject that value during `pnpm run build`.

The frontend no longer supports a direct bearer-token fallback path. Both local development and public deployment are expected to route TDX traffic through the proxy.

### Install Dependencies

```bash
pnpm install
```

### Run

```bash
pnpm dev
```

### Test

```bash
pnpm run lint
pnpm run typecheck
pnpm test
```

### Git Hooks

This project uses Husky to run checks before commit and push.

- `pre-commit`: runs `pnpm run lint` and `pnpm run typecheck`
- `pre-push`: runs `pnpm run test`

If hooks stop running locally, re-initialize Husky with:

```bash
pnpm run prepare
```

## Troubleshooting

### Hydration Mismatch Error (Development Only)

If a hydration mismatch error appears during development, it is most likely caused by a browser extension modifying the DOM before React completes hydration.

For example, dictionary lookup extensions (e.g. Moedict) may inject additional elements into the page.

Recommended solution:

- Disable the extension for `localhost`, or
- Use a clean browser profile for development.

## Geolocation Fallback (Development Only)

For local Nearby page development, you can also define a development-only geolocation fallback:

```env
VITE_DEV_GEO_FALLBACK_LAT=25.0330
VITE_DEV_GEO_FALLBACK_LNG=121.5654
```

When running in development mode, the app will use these coordinates only if browser geolocation returns `Position unavailable` or `Timeout`.
