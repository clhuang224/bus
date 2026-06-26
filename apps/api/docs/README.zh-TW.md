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

本地開發 scripts：

| Script                                     | 說明                                                 |
| ------------------------------------------ | ---------------------------------------------------- |
| `pnpm --filter @bus/api start:dev`         | 以 watch mode 啟動 API。                             |
| `pnpm --filter @bus/api start:dev:awake`   | 以 watch mode 啟動 API，並在 macOS 防止閒置休眠。    |
| `pnpm --filter @bus/api sync:routes:local` | 透過執行於 `localhost:3000` 的 API 建立 route sync。 |
| `pnpm --filter @bus/api sync:stops:local`  | 透過執行於 `localhost:3000` 的 API 建立 stop sync。  |

在 macOS 執行時間較長的本地 sync 時，可以使用 `start:dev:awake`。一般的 `start:dev` 仍保留給跨平台開發與部署環境使用。

測試資料量較大的 sync 流程時，可以用 `SYNC_CITIES` 限制本地同步城市：

```bash
SYNC_CITIES=Taipei pnpm --filter @bus/api start:dev:awake
```

城市名稱使用 TDX 的格式，例如 `Taipei`、`NewTaipei`，多個城市用逗號分隔。

### Route Sync

完整的 route sync 會依序處理全台 22 個城市。以本機 API 連線遠端 PostgreSQL 的一次實測大約需要一小時；實際時間會受到資料庫延遲和 TDX 資料量影響。

同步進度會以城市為單位建立 checkpoint。如果執行途中中斷，重新執行失敗的 sync run 時會跳過已完成的城市，從第一個尚未完成的城市繼續。

### Stop Sync

Stop sync 的資料量比 route sync 大很多。單一主要城市就可能包含數萬筆 stops 和 route-stop 關聯資料。在免費資料庫方案或本地測試時，建議先用 `SYNC_CITIES` 縮小範圍，再考慮全台 22 個城市同步。

進度 log 會依階段顯示，並且每個階段大約回報十次，讓大量匯入時看得到進度，但不會把 logs 洗得太長。

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

產生出來的 Prisma Client 會寫到 `src/generated/prisma`，並且不會進 Git。`start:dev`、`test`、`typecheck` 等 scripts 會自動執行 `prisma:generate`。如果在這些 scripts 以外直接呼叫 TypeScript 工具，需要先手動產生：

```bash
pnpm --filter @bus/api prisma:generate
```

### Database URL

先從範例檔建立本地環境變數檔：

```bash
cp apps/api/.env.example apps/api/.env.local
```

在 `apps/api/.env.local` 設定 `DATABASE_URL`。

PostgreSQL connection string 可以從資料庫服務的 dashboard 取得。以目前的 Prisma Postgres 流程來說，建立或打開 database project，複製 pooled PostgreSQL connection string，然後貼到 `DATABASE_URL`。

真實 connection string 只應該放在本地或部署環境變數裡。

設定好 `DATABASE_URL` 之後，先套用 migrations，再測試會寫入資料庫的 endpoints：

```bash
pnpm --filter @bus/api prisma:migrate:dev
```

常用 Prisma scripts：

| Script                                                                     | 說明                                                          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `pnpm --filter @bus/api format`                                            | 格式化所有 source files 和 Prisma schema files。              |
| `pnpm --filter @bus/api prisma:generate`                                   | 產生 Prisma Client 到 `src/generated/prisma`。                |
| `pnpm --filter @bus/api prisma:format`                                     | 格式化 Prisma schema files。                                  |
| `pnpm --filter @bus/api prisma:validate`                                   | 檢查 Prisma schema files 是否有效。                           |
| `pnpm --filter @bus/api prisma:migrate:status`                             | 查看目前設定的資料庫 migration 狀態。                         |
| `pnpm --filter @bus/api prisma:migrate:create -- --name add_example_table` | 建立可重複使用的 migration file，但不套用。需要連得到資料庫。 |
| `pnpm --filter @bus/api prisma:migrate:dev`                                | 在本地開發時套用 migrations。                                 |
| `pnpm --filter @bus/api prisma:migrate:deploy`                             | 部署時套用已 commit 的 migrations。                           |
| `pnpm --filter @bus/api prisma:migrate:diff`                               | 預覽已 commit migrations 到目前 schema 之間的 SQL 差異。      |
| `pnpm --filter @bus/api prisma:migrate:diff:empty`                         | 預覽從空資料庫建立目前 schema 所需的 SQL。                    |

確定要把 diff 寫成 migration file 時，再搭配 diff script 使用 `--output prisma/migrations/<timestamp>_<name>/migration.sql`。

## Database E2E

Database e2e tests 會使用真實 PostgreSQL 連線。它們需要 `DATABASE_URL` 和已套用的 migrations，也可能建立暫時資料。

檢查 database-backed flows 時，可以手動執行：

```bash
pnpm --filter @bus/api test:e2e:db
```

目前不要把 database e2e tests 加進 pre-push。等之後有穩定的測試資料庫，或有使用獨立 credentials 的 CI job，再考慮納入自動流程。

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
