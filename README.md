# Finding the Bus

A minimal single-page application for searching and tracking buses in real time.  
Built with React, Mantine, Redux Toolkit, MapLibre, and Vite.

## Tech Stack
- **Framework:** React (SPA)
- **Build Tool:** Vite
- **Router:** React Router
- **UI Library:** Mantine
- **State Management:** Redux Toolkit
- **Map:** MapLibre

## Troubleshooting

### Hydration Mismatch Error

If you encounter a hydration error during development but **the issue disappears in an incognito/private window**, it is very likely caused by a **browser extension** that modifies the DOM before React finishes hydration.

Some browser extensions inject additional elements, styles, or attributes into the page, which can cause the server-rendered HTML to differ from the client-rendered output.

**Example extensions known to cause this issue:**
- Dictionary / text lookup extensions (e.g. 萌典 Moedict)
- Dark mode extensions
- Translation tools
- Password managers

**How to verify:**
1. Open the app in an incognito/private window.
2. If the hydration error no longer appears, disable browser extensions one by one in your normal profile to identify the culprit.

**Recommended solution:**
- Disable the extension for `localhost` / development domains, or
- Use a clean browser profile without extensions for development.

For more details about hydration mismatches, see the official React documentation:  
https://react.dev/link/hydration-mismatch
