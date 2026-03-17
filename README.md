# Finding the Bus

A bus-focused single-page application for route lookup, nearby stops, and real-time transit information in Taiwan.

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

If geolocation permission is denied, the Nearby Stops feature cannot be used.

If permission is granted:

- The app determines the current city from the GPS coordinates.
- It maps that city to a service area and fetches stop data for that area.
- Stops within **0.5 kilometers** are displayed both as a list and as map markers.
- Clicking a stop opens the **Stop Page**, showing:
  - All routes serving the stop
  - Real-time bus positions

### Route Search

Users can search routes within the currently selected region.

- Route numbers can be entered using a custom bus keypad or the native keyboard.
- Matching routes are displayed as a list.
- Clicking a route opens the **Route Page**, which shows:
  - All stops along the route
  - Real-time bus positions

### Route Favorites

The Favorites page displays saved routes at specific stops.

- Clicking a favorite opens the **Route Page** with the selected stop highlighted.
- Real-time bus positions for that route are displayed.

## Current Status

Work in progress.

## Project Structure

The app is organized around route-level pages, reusable feature components, and shared domain modules.

```text
app/
├── components/
│   ├── common/               # Shared UI components
│   ├── nearby/               # Nearby feature components
│   └── providers/            # App providers
├── modules/
│   ├── apis/                 # RTK Query APIs
│   ├── consts/               # Constant maps
│   ├── enums/                # Domain enums
│   ├── hooks/                # Reusable hooks
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

- `app/pages/Favorite.tsx`: saved favorite stops
- `app/pages/Search.tsx`: route search flow
- `app/pages/Nearby.tsx`: nearby stop discovery using geolocation
- `app/pages/BusRoute.tsx`: route detail and stop list view

### Key Data Flow

1. Route screens fetch data through `app/modules/apis/bus.ts`.
2. Raw TDX fields are transformed into app-facing models in the API layer.
3. Pages coordinate screen state and pass shaped data into feature components.
4. Shared app state such as favorites, geolocation, city geo data, and global modals is stored in Redux slices.

## APIs In Use

The project currently uses the TDX Bus API base URL:

`https://tdx.transportdata.tw/api/basic/v2/Bus`

TDX, short for Transport Data eXchange, is Taiwan's transportation data platform. It provides standardized transport datasets and APIs, including bus routes, stops, and related transit data used by this project.

This project currently authenticates to TDX with a bearer access token obtained from an application-level `client_id` and `client_secret`. In practice, that means you first register an application on TDX, exchange those credentials for an access token, and then send that token in the `Authorization: Bearer ...` header for API requests.

Current endpoints used by the app:

| Method | Endpoint | Used For | Response Summary |
| --- | --- | --- | --- |
| `GET` | `/Route/City/:city` | Route search and route detail pages | Route-level data including subroutes, operators, departure stop names, and destination stop names |
| `GET` | `/StopOfRoute/City/:city` | Building stop-to-route relationships for nearby stops | Stops under each route plus destination stop data for each direction |
| `GET` | `/Stop/City/:city` | Nearby page stop discovery | Stop positions and metadata used to group nearby stops into stations |

In the actual implementation, these requests may include OData query parameters such as `$format=JSON`.

### API Model Notes

- API access is centralized in `app/modules/apis/bus.ts`.
- Raw TDX localized fields such as `Zh_tw` and `En` are transformed into app-localized objects like `{ zh_TW, en }`.
- Nearby stop route data is further shaped into view models such as `NearbyStopGroup` and `StationRoute`.

## Development

### API Token (optional)

The app can run without a token, but requests may be rate-limited.

To enable authenticated requests, create a `.env.local` file with a TDX API token.

Register an application on the [Transport Data eXchange](https://tdx.transportdata.tw/) to obtain a `client_id` and `client_secret`.

Then use the following command to request an access token:

```bash
curl --request POST \
  --url 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token' \
  --header 'content-type: application/x-www-form-urlencoded' \
  --data grant_type=client_credentials \
  --data client_id=your_client_id_here \
  --data client_secret=your_client_secret_here
```

The response will contain an access_token:

```json
{
  "access_token": "your_access_token_here",
  "expires_in": 86400,
  "token_type": "Bearer"
}
```

Add the token to .env.local:

```env
VITE_TDX_TOKEN=your_access_token_here
```

This token typically expires after 24 hours and must be regenerated periodically.

Do not commit .env.local to version control.

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
