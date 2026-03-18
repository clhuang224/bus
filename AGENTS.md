# Project Guide

This document explains how this project is organized, how data flows through the app, and which conventions to follow when adding or changing features.

Use this as the default guide for new work. When a change touches multiple areas, prefer keeping the structure and naming consistent with the patterns described here instead of introducing a new local style.

Keep `README.md` focused on product overview, setup, and usage. Small implementation conventions and team-facing coding notes should live in `AGENTS.md` or code-local comments instead of being added to the README.

## 1. Project Overview

This is a React + React Router bus application with Redux Toolkit for app state and RTK Query for bus API requests.

The current product structure is page-driven:

- `Favorite`: saved stops and quick access
- `Search`: search-based route discovery
- `Nearby`: nearby stop discovery based on geolocation
- `BusRoute`: route detail view

At a high level, most features follow this flow:

1. A page under `app/pages/` owns the screen-level flow.
2. Reusable UI is extracted into `app/components/`.
3. Shared data fetching lives in `app/modules/apis/`.
4. Global or cross-page state lives in `app/modules/slices/`.
5. Shared domain models live in `app/modules/interfaces/`, `app/modules/types/`, `app/modules/enums/`, and `app/modules/consts/`.

## 2. Directory Guide

### `app/pages/`

Pages are route-level entry points. They should own:

- screen composition
- route params and page state
- coordination between data, UI sections, and navigation

They should not become dumping grounds for every detail renderer. When a page starts carrying a self-contained subsection with its own presentation logic, extract that subsection into `app/components/`.

Current examples:

- `AppLayout.tsx`: shared page shell
- `Favorite.tsx`: default index page
- `Search.tsx`: search flow
- `Nearby.tsx`: geolocation and nearby stop flow
- `BusRoute.tsx`: route detail page

### `app/components/`

Components are reusable UI building blocks. They may be:

- cross-page components such as inputs, links, or modals
- page-adjacent components grouped by feature, such as `app/components/nearby/`

Use feature folders when a set of components clearly belongs to one page or one domain area.

Examples:

- `app/components/nearby/NearbyStopDetail.tsx`
- `app/components/nearby/NearbyStopMap.tsx`
- `app/components/nearby/NearbyStopRoutes.tsx`

Component extraction is usually a good idea when:

- a JSX block is long enough to hide the page flow
- a UI block has its own inputs and rendering rules
- a section should feel like a named concept in the domain

### `app/modules/apis/`

This folder owns remote data access and response transformation.

Responsibilities:

- define RTK Query endpoints
- transform raw API responses into app-facing models
- centralize API error handling behavior

Keep API response adaptation here rather than spreading raw field mapping across pages.

### `app/modules/slices/`

Redux slices belong here. Use slices for cross-page or app-level state, not for purely local component state.

Current examples include:

- geolocation state
- favorite stops
- city geo data
- global modal state

If a state value only affects one component or one page and does not need store-level access, prefer `useState` or a local hook instead of adding a slice.

### `app/modules/interfaces/`

Put reusable object-shaped domain models and API contracts here.

Good fits:

- API response object shapes
- transformed app-facing object models
- feature-specific reusable objects such as `NearbyStopGroup` or `StationRoute`

Prefer explicit field types in public interfaces. Avoid indexed access types such as `Stop['StopName']` unless you are doing real type plumbing and there is a clear payoff.

Strongly related raw and transformed models may live in the same file when they are maintained as a pair, such as `TdxStop` and `Stop`.

Split raw and transformed models into separate files only when:

- the file becomes too large
- the raw and transformed models diverge significantly
- the transformed model is reused independently enough to justify separation

### `app/modules/types/`

Put reusable type aliases, tuples, utility types, and shared non-object type helpers here.

Good fits:

- coordinate tuples
- localized text helper types
- shared unions or mapped utility types

If something is primarily an object model with named fields, it probably belongs in `interfaces/` instead.

### `app/modules/enums/`

Use enums for stable, domain-level categorical values such as city, direction, or status types.

If enum values need user-facing labels or derived metadata, define a colocated map such as `directionMapName` and derive from the enum plus that map. Do not scatter hard-coded label strings across the app.

### `app/modules/consts/`

Use this folder for shared static lookup data and constant maps.

Current examples:

- city names
- area names
- direction labels
- geolocation messages

Use `consts/` for plain constant data. If the value represents behavior or transformation logic, it likely belongs in `utils/` or a component/module instead.

### `app/modules/utils/`

Use utilities for shared pure logic that is not tied to rendering.

Good fits:

- geographic lookup helpers
- enum helpers
- sorting or formatting helpers used in multiple places

Do not move tiny single-file implementation details into `utils/` too early. If logic is only used in one page or one component and is still easy to read there, keep it local.

### `app/modules/hooks/`

Place reusable custom hooks here when they encapsulate behavior shared across pages or components.

Examples:

- geolocation watching
- favorite stop behavior

If a hook is truly private to one component and unlikely to be reused, keeping it next to that component is acceptable.

## 3. Routing And State Architecture

### Routing

Routes are declared in `app/routes.ts`.

Current route structure:

- `/` -> `AppLayout`
- index -> `Favorite`
- `/bus-route/:city/:id` -> `BusRoute`
- `/search` -> `Search`
- `/nearby` -> `Nearby`

When adding a new page, define the route in `app/routes.ts` and place the page component under `app/pages/`.

This project should follow React Router v7 framework mode conventions wherever practical.

Prefer React Router's built-in primitives for route state and navigation behavior, such as route modules, route params, search params, links, navigation helpers, and framework-mode file conventions, before introducing custom wrappers or ad hoc URL state helpers.

This project is deployed with GitHub Pages and React Router v7, so all `href`, asset URLs, icon links, and similar path-based settings must account for the difference between the local base URL and the production GitHub Pages base URL.

When adding or changing URL-like values, use relative paths by default so they work in both local development and the deployed GitHub Pages base path. Do not assume the app is always served from `/`, and do not hard-code root-absolute paths unless there is a clear, documented reason.

### Store

The Redux store is defined in `app/modules/store.ts`.

Use the store for:

- app-wide UI state
- cross-page domain state
- data that needs central coordination

Do not push local rendering state into Redux unless there is a strong reason.

This project should also follow Redux Toolkit and RTK Query conventions wherever practical.

Prefer standard Redux Toolkit patterns such as slices, typed selectors, typed dispatch, RTK Query endpoints, and API-layer transforms before introducing custom state containers or alternative async data flow patterns.

### API Data Flow

The preferred data flow is:

1. Fetch raw data via RTK Query in `app/modules/apis/bus.ts`
2. Transform raw TDX fields into app-facing shapes inside the API layer
3. Consume transformed models in pages and components

This keeps pages focused on behavior and presentation instead of raw response cleanup.

When the same kind of API request must be sent to multiple sibling targets, such as multiple cities in the same area, prefer `await Promise.all(...)` over sequential requests unless request ordering or rate limiting is a real requirement.

If both city-level and area-level RTK Query endpoints exist, only export the hooks that are actually used by the app. Do not keep unused lower-level hook exports around by default.

Across the project, prefer `async` / `await` over chained `.then()` / `.catch()` promise style unless there is a clear reason not to.

## 4. UI And Copy Rules

### Language

Use English for developer-facing console output such as:

- `console.warn`
- `console.error`
- logs

Use Traditional Chinese for user-facing UI copy such as:

- alerts
- empty states
- inline warnings
- buttons, labels, and helper text shown to users

### UI Structure

Prefer components that express domain concepts clearly.

For example, if a JSX block represents "routes under a nearby stop", naming and extracting it as `NearbyStopRoutes` is better than leaving a long anonymous block inside a page.

When reviewing a UI block, ask:

- Is this a screen-level concern that belongs in the page?
- Or is this already a named piece of the feature that deserves its own component?

When working with Mantine components, prefer Mantine props, variants, spacing, radius, color, and layout primitives over custom `style` or `styles` overrides whenever the built-in API can express the same intent.

For responsive logic, prefer breakpoint-based names such as `isSm` or `isMd` over device labels such as `isMobile` or `isTablet`, and derive media queries from Mantine theme breakpoints when practical.

### Rendering Patterns

Use simple inline template rendering for very small, one-off sections.

Use data-driven `map` rendering when:

- the UI is clearly a repeated structure
- multiple rows or sections share the same shape
- the mapping improves readability instead of hiding it

Do not force array-driven rendering when the data only contains one or two fields and the JSX becomes harder to understand.

## 5. Model And File Placement Rules

When deciding where a new shape or helper should live, use this quick guide:

- Reusable object model: `app/modules/interfaces/`
- Reusable alias/tuple/union/helper type: `app/modules/types/`
- Enum category: `app/modules/enums/`
- Enum display map or static lookup data: `app/modules/consts/`
- Shared pure helper logic: `app/modules/utils/`
- Cross-page or shared behavior hook: `app/modules/hooks/`
- Feature UI block: `app/components/<feature>/`
- Screen entry point: `app/pages/`

Keep types inside a component file only when they are truly private to that component alone.

## 6. Testing Guidance

Prefer colocated tests for small modules and utilities using `*.test.ts` next to the implementation file.

Only move tests into a dedicated folder such as `__tests__/` when:

- the directory becomes crowded
- shared fixtures or helpers make it worthwhile

Testing priorities:

- app logic
- user-visible behavior
- component contracts

For utility functions, prefer focused unit tests.

For React components, prefer testing:

- state branches
- user interactions
- parent-child contracts

Avoid brittle assertions against:

- third-party DOM structure
- generated class names
- animation details
- map library internals

For integrations with heavy UI libraries or maps, prefer lightweight mocks that preserve the component contract instead of testing the third-party library itself.

## 7. Commit Rules

Follow Conventional Commits for commit messages.

Format commit subjects as:

`<type>[optional scope]: <description>`

Use:

- `feat` for new user-facing functionality
- `fix` for bug fixes and behavior corrections
- other types such as `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `style`, and `perf` when appropriate

Use an optional scope when it adds useful context, such as:

- `fix(nearby): ...`
- `refactor(geolocation): ...`

Keep the subject concise and imperative.

Commit body rules depend on how the commit is created:

- if the user creates a commit manually, a body is optional
- if an AI agent creates the commit, always include a body

Commit body rules:

- add a blank line between the subject and body
- explicitly summarize the concrete changes included in the commit
- do not leave the body vague or generic

Mark breaking changes with `!` in the header or a `BREAKING CHANGE:` footer when needed.

This repository uses Husky hooks as a local quality gate:

- `pre-commit` runs `pnpm run lint` and `pnpm run typecheck`
- `commit-msg` validates the Conventional Commit header format
- `pre-push` runs `pnpm run test`

When preparing changes, expect these hooks to run unless the user explicitly asks to bypass them.

## 8. Working Style Expectations

When making changes in this repository:

- preserve existing structure unless there is a clear architectural reason to improve it
- prefer small, named components over long anonymous JSX blocks
- keep data transformation close to the API layer
- keep page files focused on screen flow
- choose readability over clever abstraction

If a new pattern is introduced, it should make the surrounding code easier for the next person to navigate, not just shorter.
