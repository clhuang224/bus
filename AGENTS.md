# Workspace Guide

This repository is a pnpm monorepo for Finding the Bus. Keep root-level documentation focused on orientation, workspace layout, shared workflows, and cross-project decisions. Put app-specific or package-specific details inside the owning workspace.

## Workspace Layout

```text
apps/
├── web/          # React Router frontend
├── tdx-proxy/    # Cloudflare Worker proxy for TDX authentication
└── api/          # NestJS backend with PostgreSQL base data and TDX realtime

packages/
└── shared/       # Shared API contracts, domain enums, and TDX upstream types
```

## Documentation Ownership

- Root `README.md`: product-level overview, workspace map, common setup commands, and links to workspace docs.
- `docs/README.zh-TW.md`: Traditional Chinese version of the root workspace guide.
- `docs/plan.md`: architecture, database design decisions, current state, open questions, and next steps.
- `docs/plan.zh-TW.md`: Traditional Chinese version of the plan. Update it in the same change whenever `docs/plan.md` changes, so the two stay in step.
- `apps/web/README.md`: frontend product features, frontend structure, open data usage, and web development details.
- `apps/web/AGENTS.md`: frontend-specific coding, UI, data-flow, and testing conventions.
- `apps/api/README.md`: API setup, local API mode, sync scripts, endpoint groups, and Prisma workflow.
- `apps/api/AGENTS.md`: backend-specific structure, DTO, Prisma, and TDX request conventions.
- `apps/api/docs/`: error handling rules and sync troubleshooting notes. Table and column definitions live in the Prisma schema, not in docs.
- `apps/tdx-proxy/README.md`: Worker proxy setup, local development, and manual deployment.
- `packages/shared/README.md`: shared package boundaries and contract rules.

When adding new documentation, prefer the narrowest owning workspace. Root docs should guide readers to the right place instead of collecting every implementation detail.

## Workspace Commands

Use root scripts for broad workspace checks:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

Use workspace filters for package-specific work:

```bash
pnpm --filter @bus/web lint
pnpm --filter @bus/web typecheck
pnpm --filter @bus/web test
pnpm --filter @bus/tdx-proxy dev
```

The default local development command remains:

```bash
pnpm run dev
```

It starts the frontend dev server and the local TDX proxy together.

To develop against the local NestJS API and database, use:

```bash
pnpm run dev:api
```

It also starts the API, and the web app reads base data from it. See the
[web local API mode](./apps/web/README.md#local-api-mode) for setup.

## Current Workspace Roles

- `@bus/web` owns the user-facing SPA and current production UI.
- `@bus/tdx-proxy` owns TDX authentication proxying for the production web app. Its deployment is manual for now; do not add it to GitHub Actions deployment unless that rollout is explicitly requested. It is planned to retire once the API is deployed and the web app no longer calls TDX directly.
- `@bus/api` owns TDX base-data sync into PostgreSQL, database-backed route and station endpoints, and cached TDX realtime snapshots. It runs locally and is not deployed yet.
- `@bus/shared` owns contracts shared between the web app and the API, plus the TDX upstream types both of them read.

## CI And Deployment

GitHub Actions currently checks and deploys only the web workspace:

- PR checks run `@bus/web` lint, typecheck, and tests, plus the Playwright map test against a production build.
- GitHub Pages deployment builds `@bus/web`.
- API and shared checks run locally through the Husky hooks, not in CI.
- The Cloudflare Worker proxy is deployed manually with `pnpm --filter @bus/tdx-proxy deploy`.

Keep this separation unless the deployment strategy changes.

## Commit Rules

Follow Conventional Commits for commit messages.

Format commit subjects as:

`<type>[optional scope]: <description>`

Use:

- `feat` for new user-facing functionality
- `fix` for bug fixes and behavior corrections
- other types such as `docs`, `refactor`, `test`, `chore`, `build`, `ci`, `style`, and `perf` when appropriate

Use an optional scope when it adds useful context, such as:

- `fix(nearby): ...`
- `refactor(monorepo): ...`

Keep the subject concise and imperative.

Commit body rules depend on how the commit is created:

- if the user creates a commit manually, a body is optional
- if an AI agent creates the commit, always include a body

Commit body rules:

- add a blank line between the subject and body
- explicitly summarize the concrete changes included in the commit
- do not leave the body vague or generic
- do not write literal `\n` sequences in the commit message; use real line breaks in the body

Mark breaking changes with `!` in the header or a `BREAKING CHANGE:` footer when needed.

This repository uses Husky hooks as a local quality gate:

- `pre-commit` runs `pnpm run lint` and `pnpm run typecheck`
- `commit-msg` validates the Conventional Commit header format
- `pre-push` runs `pnpm run test`

When preparing changes, expect these hooks to run unless the user explicitly asks to bypass them.
