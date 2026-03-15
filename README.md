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

If geolocation permission is denied, a message is displayed indicating that the feature cannot be used.

If permission is granted:

- The app determines the current city from the GPS coordinates.
- It fetches stop data for that city.
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

## Troubleshooting

### Hydration Mismatch Error (Development Only)

If a hydration mismatch error appears during development, it is most likely caused by a browser extension modifying the DOM before React completes hydration.

For example, dictionary lookup extensions (e.g. Moedict) may inject additional elements into the page.

Recommended solution:

- Disable the extension for `localhost`, or
- Use a clean browser profile for development.
