# Workspace Guide

This repository is a pnpm monorepo for Finding the Bus. Keep root-level documentation focused on orientation, workspace layout, shared workflows, and cross-project decisions. Put app-specific or package-specific details inside the owning workspace.

## Workspace Layout

```text
apps/
├── web/          # React Router frontend
├── tdx-proxy/    # Cloudflare Worker proxy for TDX authentication
└── api/          # Planned NestJS backend

packages/
└── shared/       # Planned shared API contracts and domain types
```

## Documentation Ownership

- Root `README.md`: product-level overview, workspace map, common setup commands, and links to workspace docs.
- `docs/README.zh-TW.md`: Traditional Chinese version of the root workspace guide.
- `docs/plan.md`: backend migration and architecture planning notes.
- `apps/web/README.md`: frontend product features, frontend structure, open data usage, and web development details.
- `apps/web/AGENTS.md`: frontend-specific coding, UI, data-flow, and testing conventions.
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

## Current Workspace Roles

- `@bus/web` owns the user-facing SPA and current production UI.
- `@bus/tdx-proxy` owns TDX authentication proxying. Its deployment is manual for now; do not add it to GitHub Actions deployment unless that rollout is explicitly requested.
- `@bus/api` is a placeholder for the planned NestJS backend.
- `@bus/shared` is a placeholder for shared API contracts and domain types.

## CI And Deployment

GitHub Actions currently checks and deploys only the web workspace:

- PR checks run `@bus/web` lint, typecheck, and tests.
- GitHub Pages deployment builds `@bus/web`.
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
