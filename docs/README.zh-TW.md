# 找找公車

[English](../README.md) | [繁體中文](./README.zh-TW.md)

這是一個查詢台灣公車路線的網頁應用。初期是單純的前端專案，正在走向前後端分離的 monorepo。

目前正式上線的是 React Router 前端，提供路線搜尋、附近站牌、收藏、語言設定與即時公車資訊。NestJS 後端、資料庫同步，以及前後端共用的 API contract 已可在本機使用，接下來會逐步導入正式版。

## Workspaces

```text
apps/
├── web/          # React Router 前端
├── tdx-proxy/    # TDX 驗證用的 Cloudflare Worker proxy
└── api/          # NestJS 後端

packages/
└── shared/       # 共用 API contract、型別與即時資料規則
```

## Workspace 文件

| Workspace         | 用途                                           | 文件                                                      |
| ----------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `apps/web`        | 使用者介面的 React Router app                  | [apps/web/README.md](../apps/web/README.md)               |
| `apps/tdx-proxy`  | TDX 驗證用 Cloudflare Worker proxy             | [apps/tdx-proxy/README.md](../apps/tdx-proxy/README.md)   |
| `apps/api`        | NestJS 後端                                    | [apps/api/README.md](../apps/api/README.md)               |
| `packages/shared` | 共用 API contract、domain types 與即時資料規則 | [packages/shared/README.md](../packages/shared/README.md) |

如果想了解後端與資料庫的規劃，可以先看 [docs/plan.zh-TW.md](./plan.zh-TW.md)。

## 如何使用

直接前往 [bus.lynns.me](https://bus.lynns.me) 即可開始使用目前的前端版本。

![demo](./assets/demo.zh-TW.png)

## 設定

安裝依賴：

```bash
pnpm install
```

設定本地 TDX proxy。這是為了讓本機開發時也能透過 Worker proxy 取得 TDX 資料，而不是把 TDX credentials 放進前端：

```bash
cp apps/tdx-proxy/.dev.vars.example apps/tdx-proxy/.dev.vars
```

接著在 `.dev.vars` 裡填入 `TDX_CLIENT_ID` 與 `TDX_CLIENT_SECRET`。

## 開發

一般開發可以從 root 啟動，這會同時跑前端 dev server 與本地 Worker proxy：

```bash
pnpm run dev
```

如果要用同一個區域網路裡的手機測試：

```bash
pnpm run dev:mobile
```

瀏覽器只允許安全來源取得位置，所以這個模式會用自簽憑證以 HTTPS 提供網頁。在手機上開啟 Vite 印出的 `https://` 區網網址，第一次連線時接受憑證警告就好。

如果要搭配 NestJS API 和 PostgreSQL 資料庫開發，可以使用 local API 模式。這個模式會啟動 API 而不是 TDX proxy，前端的路線、站牌、站位與即時資料都改由 API 提供：

```bash
pnpm run dev:api
```

local API 模式需要先設定資料庫並完成資料同步，詳見 [web local API mode](../apps/web/README.md#local-api-mode) 與 [API local development](../apps/api/README.md#local-development)。

## 檢查

如果想確認整個 workspace 目前狀態，可以跑：

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
```

如果這次只改到前端，可以只跑 web workspace：

```bash
pnpm --filter @bus/web lint
pnpm --filter @bus/web typecheck
pnpm --filter @bus/web test
```

## 部署

GitHub Actions workflow 目前只會 build 並部署 `@bus/web` 到 GitHub Pages。

TDX proxy 目前仍維持手動部署，避免每次前端部署都連動 Worker：

```bash
pnpm --filter @bus/tdx-proxy deploy
```

NestJS 後端尚未部署。等後端部署完成、前端的資料都改由 API 提供之後，TDX proxy 預計會停用。
