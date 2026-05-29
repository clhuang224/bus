# TDX Proxy

This workspace contains the Cloudflare Worker used to proxy TDX API requests and keep TDX credentials out of the frontend.

## Responsibilities

- Handle TDX authentication.
- Forward allowed bus API requests from the web app.
- Keep `TDX_CLIENT_SECRET` and bearer tokens out of GitHub Pages builds.
- Provide the local proxy used by `pnpm run dev`.

## Local Setup

Copy the example vars file and fill in TDX credentials:

```bash
cp apps/tdx-proxy/.dev.vars.example apps/tdx-proxy/.dev.vars
```

Run the Worker directly:

```bash
pnpm --filter @bus/tdx-proxy dev
```

The root development command starts both the web app and this proxy:

```bash
pnpm run dev
```

## Deployment

The Worker is deployed manually for now:

```bash
pnpm --filter @bus/tdx-proxy deploy
```

Do not add this Worker to GitHub Actions deployment unless the deployment strategy is explicitly changed. Cloudflare deployment needs account-specific credentials and rollout decisions that are separate from GitHub Pages.

## Environment Bindings

Set these values in Cloudflare Worker environment bindings:

- `TDX_CLIENT_ID`
- `TDX_CLIENT_SECRET`
- `ALLOWED_ORIGINS`
