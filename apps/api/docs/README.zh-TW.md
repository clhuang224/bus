# FTB API

[English](../README.md) | [繁體中文](./README.zh-TW.md)

Finding the Bus 的 NestJS 後端 workspace。

API 目前採用 contract-first 的方式開發：在資料庫同步和 TDX 上游整合真正實作前，先把 endpoint 和 DTO 設計成前後端拆分後會使用的形狀。

## 本地開發

從 repository root 啟動 API workspace：

```bash
pnpm --filter @bus/api start:dev
```

開發伺服器預設使用 `3000` port。

## API 文件

Scalar 會渲染產生出來的 OpenAPI 文件：

- Scalar reference：`http://localhost:3000/reference`
- OpenAPI JSON：`http://localhost:3000/openapi-json`
- Swagger UI fallback：`http://localhost:3000/openapi`

應用程式 endpoint 都會加上 `/api` prefix。

## 測試

- unit test 會放在 `src/` 底下，靠近被測試的 source file
- e2e test 會放在 `test/` 底下，並依 API resource 分組，例如 `health.e2e-spec.ts` 或 `routes.e2e-spec.ts`
- 共用的 e2e app bootstrap 放在 `test/create-e2e-app.ts`，讓 global prefix 和之後可能加入的 global setup 可以在各個 suite 之間保持一致

## Prisma

Prisma schema files 放在 `prisma/` 底下。

產生出來的 Prisma Client 會寫到 `src/generated/prisma`，並且不會進 Git。直接跑 TypeScript 前，需要先產生 Prisma Client：

```bash
pnpm --filter @bus/api prisma:generate
```

常用 Prisma scripts：

| Script | 說明 |
| --- | --- |
| `pnpm --filter @bus/api prisma:generate` | 產生 Prisma Client 到 `src/generated/prisma`。 |
| `pnpm --filter @bus/api prisma:format` | 格式化 Prisma schema files。 |
| `pnpm --filter @bus/api prisma:validate` | 檢查 Prisma schema files 是否有效。 |
| `pnpm --filter @bus/api prisma:migrate:status` | 查看目前設定的資料庫 migration 狀態。 |
| `pnpm --filter @bus/api prisma:migrate:create -- --name add_example_table` | 建立可重複使用的 migration file，但不套用。需要連得到資料庫。 |
| `pnpm --filter @bus/api prisma:migrate:dev` | 在本地開發時套用 migrations。 |
| `pnpm --filter @bus/api prisma:migrate:deploy` | 部署時套用已 commit 的 migrations。 |
| `pnpm --filter @bus/api prisma:migrate:diff` | 預覽已 commit migrations 到目前 schema 之間的 SQL 差異。 |
| `pnpm --filter @bus/api prisma:migrate:diff:empty` | 預覽從空資料庫建立目前 schema 所需的 SQL。 |

確定要把 diff 寫成 migration file 時，再搭配 diff script 使用 `--output prisma/migrations/<timestamp>_<name>/migration.sql`。

## Endpoint Groups

- `system`：服務健康檢查
- `routes`：路線列表和路線詳情 contracts
- `stations`：站位和附近站位 contracts
- `realtime`：適合 polling 的即時資料快照 contracts
- `admin`：基礎資料同步入口

## Backlog Endpoint Groups

這些 groups 目前只是 contract placeholders，需要等 account/auth 工作完成後，才會進入第一階段後端範圍：

- `favorite`：以帳號為基礎的收藏路線和站位 contracts
- `settings`：以帳號為基礎的設定同步 contracts

## Planned Responsibilities

- TDX authentication 和上游 request shaping
- 基礎資料同步到 PostgreSQL
- 由資料庫支援的 route 和 station API endpoints
- request pacing 和 TDX quota 保護
- Scalar/OpenAPI 文件

目前的後端遷移計劃請看 [docs/plan.md](../../../docs/plan.md)。
