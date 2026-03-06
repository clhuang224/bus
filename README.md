# Finding the Bus

A minimal single-page application for searching and tracking buses in real time.  
Built with React, Mantine, Redux Toolkit, MapLibre, and Vite.

## Tech Stack

- **Framework:** React (SPA)
- **Build Tool:** Vite
- **Routing:** React Router
- **UI Library:** Mantine
- **State Management:** Redux Toolkit
- **Data fetching:** RTK Query
- **Map Engine:** MapLibre GL JS
- **Basemap:** CARTO (raster tiles)

## Application Flow

### App Initialization

On first launch, the app requests geolocation permission.

- If granted, the current GPS coordinates are stored.
- If denied, the "Nearby Stops" feature becomes unavailable.

### Nearby Stops

The Nearby Stops page is based on the user's current GPS location.

If geolocation permission is denied, a message is displayed indicating that the feature cannot be used.

If permission is granted:

- The app determines the current city from the GPS coordinates.
- It fetches stop data for that city.
- Stops within **500 meters** are displayed both as a list and as map markers.
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


## Troubleshooting

### Hydration Mismatch Error (Development Only)

If a hydration mismatch error appears during development, it is most likely caused by a browser extension modifying the DOM before React completes hydration.

For example, dictionary lookup extensions (e.g. Moedict) may inject additional elements into the page.

Recommended solution:

- Disable the extension for `localhost`, or
- Use a clean browser profile for development.
