# 開發計畫

[English](./plan.md) | [繁體中文](./plan.zh-TW.md)

## 概況

目前僅有前端正式部署在 GitHub Pages，基礎資料和即時資料都是透過 Cloudflare Worker proxy 直接打 TDX API。這是因應初期探索前端框架的需要。但這種做法有無可避免的缺點：每個使用者都在消耗同一把 TDX key 的額度，前端也得自己組合 TDX 的原始資料。

現在已經有一個可以在本機執行的 NestJS 後端，搭配 PostgreSQL 資料庫。後端會把 TDX 的基礎資料 sync 進資料庫，用資料庫提供路線和站位資料，也會提供有 cache 的 TDX 即時資料快照。前端可以在本地開發時測試這個方式。接下來要做的是：把前端的即時資料也改成走 API、部署 API，然後把正式環境切過去。

## 目標

- 減少直接打 TDX 的次數，把常用的路線和站牌流程改成讀自己的資料。後端不只是一層 proxy：後端要存好非即時的基礎資料，讓前端在常用的路線和站牌流程上改用這些資料。
- 長期希望只用 TDX 的免費方案。目前哪些部分做得到，請看 [TDX 額度](#tdx-額度)。

## 架構

### Monorepo

```txt
apps/
  web/        React Router 前端
  tdx-proxy/  處理 TDX 驗證的 Cloudflare Worker proxy
  api/        NestJS 後端
packages/
  shared/     共用的 API contract、enum 和 TDX 上游型別
```

shared 要維持精簡，只放前後端真的會共用的 contract。NestJS 專用的 DTO class 留在 API workspace。

### 後端

NestJS API 負責：

- TDX 驗證
- 排程或手動的基礎資料 sync
- 由資料庫提供的路線和站位 endpoint
- 向 TDX 取得、並在記憶體裡短暫 cache 的即時資料快照
- 整理 request 和 response DTO
- 保護 TDX 額度

API 文件用 Scalar 搭配 OpenAPI，隨著 endpoint 一起擴充。

### 資料庫

API 用 PostgreSQL 搭配 Prisma。資料表、欄位和 index 以 `apps/api/prisma/models/` 裡的 Prisma schema 為準，命名和型別規則寫在 `apps/api/AGENTS.md`。這一節記錄的是 schema 背後的決策。

schema 涵蓋基礎資料（路線、子路線、業者、站位群組、站位、站牌、路線站序、路線形狀）和 sync 的紀錄。車輛、使用者、收藏、設定的 model 也已經建好，只是還沒有功能用到。

```mermaid
erDiagram
  sync_run ||--o{ sync_run_city : checkpoints
  sync_run ||--o{ sync_error : has
  sync_run ||--o{ tdx_request_log : records

  route ||--o{ subroute : has
  route ||--o{ route_operator : has
  operator ||--o{ route_operator : operates

  subroute ||--o{ route_stop : has
  subroute ||--o| route_shape : has

  station_group ||--o{ station : contains
  station ||--o{ stop : groups
  stop ||--o{ route_stop : appears_in

  user ||--o{ favorite_route_stop : owns
  route ||--o{ favorite_route_stop : references
  subroute ||--o{ favorite_route_stop : references
  stop ||--o{ favorite_route_stop : references
  user ||--o| user_setting : owns
```

決策：

- **附近站牌以站位為單位，不是以站牌為單位。** TDX 把站位群組、站位、站牌分開，所以 schema 也分成三張表。站牌指的是一支實體站牌，也是 `route_stop` 所指向的資料。有些城市的站位資料不完整，所以 `station.station_group_id` 和 `stop.station_id` 可以是 null。附近站牌的 endpoint 直接回傳整理好的站位，前端不用知道是用 TDX 的哪些資料組出來的。
- **ID。** 對外的 `uuid` 都來自 TDX：路線是 `RouteUID`、站牌是 `StopUID`、站位是 `StationUID`，子路線則是 `<SubRouteUID>-<Direction>`，因為同一個 TDX 子路線可能有兩個方向。其他資料會用到的 TDX 原始 ID，存在 `tdx_*` 欄位，例如 `tdx_subroute_uid` 和 `tdx_stop_id`。
- **路線站序用 `sequence` 排。** 一個子路線可能經過同一個站好幾次，所以 `route_stop` 是以「子路線 + 站序」為唯一，不是以站牌為唯一。
- **不存 `area` 欄位。** 查詢時由 API 把搜尋區域換成對應的城市。
- **路線形狀存成看得懂的座標。** `route_shape.path` 存 `[經度, 緯度]` 的陣列，`source` 記錄路徑來自 encoded polyline、geometry，還是站牌座標。TDX 沒有可用的形狀時，就用依站序排好的站牌座標組出來。
- **暫時不用 PostGIS。** 附近站牌的搜尋用一般的經緯度欄位，先用範圍框篩選，再算精確距離。等真的需要空間查詢時再考慮 PostGIS。
- **英文地址是翻譯來的，不是 sync 來的。** TDX 只提供中文地址。sync 時只要 `address_zh_tw` 沒變，就保留 `address_en`；中文地址變了，就清掉 `address_en`。
- **即時資料不存進資料庫。** API 把即時資料快照 cache 在記憶體，請看 [即時資料](#即時資料)。
- **基礎資料用軟刪除。** 收藏可能會指向路線和站牌，所以最新 TDX 資料裡消失的紀錄只標成停用，不直接刪掉；之後又出現的話就重新啟用。收藏本身的資料列可以直接刪。

### 基礎資料 Sync

- admin endpoint 建立一筆 `sync_run` 後馬上回應，實際的 sync 在背景執行，這樣 HTTP request 不用在所有城市 sync 完之前一直開著。
- 路線和站牌的 sync 會一個城市一個城市處理，每個城市記一筆 `sync_run_city` checkpoint。重新執行時會跳過已經完成的城市。sync 寫入是冪等的，所以中斷的城市可以安全地重新執行。
- sync service 只描述要抓什麼，速度和額度由 sync 用的 TDX client 控管。這個 client 每打一次 TDX 就寫一筆 `tdx_request_log`，每次發出 request 前，都會根據這些紀錄檢查這分鐘和這個月的額度，並用 PostgreSQL 的 advisory lock 讓不同的 API instance 共用同一份計數。
- 額度暫時用完時，sync run 會變成 `pending`，並記下可以重試的時間 `resume_after_at`。遇到預期外的錯誤就標成 `failed`。
- mapper 依邊界分開：TDX 轉資料庫紀錄的，貼近 Prisma 欄位；資料庫紀錄轉 API response 的，貼近頁面要用的 contract。
- `records_*` 計數以 sync 的資源為單位：路線 sync 算的是路線的資料列，不含子路線和業者的寫入。
- 一個月 sync 一次就夠了，因為路線和站牌的基礎資料很少變動。

目前遇過的 sync 失敗和處理方式，請看 `apps/api/docs/sync-troubleshooting.md`。

### 即時資料

`GET /api/realtime/routes/:uuid` 被呼叫時，才去 TDX 抓那條路線的到站時間、靠站資訊和 GPS 位置，並回傳每個子路線要顯示的內容。每條路線的快照會在記憶體 cache 90 秒，有來源失敗時只 cache 5 秒；同一條路線同時有多個 request 時，只會抓一次。即時資料有自己的 TDX client，預設每秒最多 3 次，把同一把 key 剩下的額度留給 sync 和 proxy。

### 部署

前端繼續放在 GitHub Pages。

NestJS 後端要部署到常駐的主機，例如 Render，再搭配託管的 PostgreSQL。本機開發用的是 Prisma Postgres，正式環境的資料庫要在部署前選好，並寫進文件。

sync worker 不要部署到 serverless 平台：sync worker 會接續背景的 sync run，可能執行很久。另外 API 只能執行一個 instance，因為即時資料的 cache 和限流都在記憶體裡。

部署前要先處理：

- 確認 PostgreSQL 和主機的專案，以及 API 怎麼連到資料庫
- 在主機上設定環境變數，`.env.example` 只放範例值
- 決定已 commit 的 Prisma migration 要怎麼套用到正式資料庫
- 先替 admin sync endpoint 加上保護，才能讓這些 endpoint 改動資料
- 決定每月的排程 sync 要在哪裡執行

等 API 部署好、前端的資料都改由 API 提供之後，就停用 TDX proxy。在那之前，正式環境還是需要 proxy，而且 proxy 跟 API 共用同一把 TDX key。

## 目前狀態

### API Endpoint

應用的 endpoint 都以 `/api` 開頭。

| Method | Endpoint                     | 說明                                   |
| ------ | ---------------------------- | -------------------------------------- |
| GET    | `/api/health`                | 健康檢查                               |
| GET    | `/api/routes?area=...`       | 某個搜尋區域的路線列表，來自資料庫     |
| GET    | `/api/routes/:uuid`          | 路線詳情，包含子路線、站牌和路線形狀   |
| GET    | `/api/stations`              | 附近的站位和經過的路線                 |
| GET    | `/api/realtime/routes/:uuid` | 單一路線的即時資料快照，來自 TDX       |
| POST   | `/api/admin/sync/routes`     | 排入一次路線 sync                      |
| POST   | `/api/admin/sync/stops`      | 排入一次站牌 sync                      |
| GET    | `/api/admin/sync/runs`       | 最近的 sync run 列表                   |
| GET    | `/api/admin/sync/runs/:uuid` | 單一 sync run 的詳情，包含各城市的進度 |

補充：

- 路線詳情會附上 TDX 的對應 ID（每個子路線的 `SubRouteUID`，以及每個站牌的 `StopID` 和 `StationID`），讓前端能對上 TDX 的即時資料，也讓已存的收藏 ID 維持不變。
- 附近站牌回傳的每一筆都對應到一個站位。沒有站位的站牌目前不回傳，等決定好產品上的呈現方式再處理。站位地址會把站位本身和底下站牌的地址，依語言合併。
- 在 local API 模式（`pnpm run dev:api`，本地開發時改用 API 的模式）下，附近站牌頁的網址存的是站位 uuid。TDX 模式下的網址不會自動轉換。
- 收藏和設定的 endpoint 目前只是 contract placeholder，請看 [待辦](#待辦)。

### 進度

- monorepo、NestJS API、Scalar 文件、Prisma schema 和 migration 都已經建好。
- 路線和站牌的 sync 會在背景處理所有支援的城市：記錄 TDX request、保護額度、依城市 checkpoint 接續，並把上游已經沒有的資料標成停用。完整的 sync 已經在全台執行過，最近一次是 2026 年 10 月。
- 可以透過 admin 的 sync run endpoint 查看 sync 的狀況。
- local API 模式下，附近站牌、搜尋公車和路線頁的基礎資料都改讀資料庫 API；預設模式和正式環境還是走 TDX proxy。
- 前端只在 `transitApi` 一個地方決定資料來源，所以兩種模式下，頁面和 hook 拿到的都是同一種前端 model。
- API 已經能提供以應用 uuid 為主的即時資料快照，但前端在所有模式下，都還是直接向 TDX 讀即時資料。

### 資料庫大小

2026-10-13 的觀察，在 10 月的路線和站牌 sync 之後。大小來自 `pg_size_pretty`，單位是以 1024 計算的 MiB、KiB。

- 資料庫總大小：約 191 MiB，2026-07-10 時約 148 MB
- Prisma 免費方案的容量上限參考：512 MiB

| 資料表           | 估計列數 |  總大小 | 資料本身 |   Index | 說明                                      |
| ---------------- | -------: | ------: | -------: | ------: | ----------------------------------------- |
| `route_stop`     |  244,063 |  83 MiB |   33 MiB |  49 MiB | 最大的表，index 比資料本身還大。          |
| `stop`           |  136,965 |  60 MiB |   34 MiB |  26 MiB | 站牌 sync 的主要資料表。                  |
| `station`        |   52,163 |  18 MiB |  9.9 MiB | 8.4 MiB | 不是每個城市都有站位資料。                |
| `route_shape`    |    6,141 |  11 MiB |   11 MiB | 656 KiB | 路線詳情和站牌座標備援共用的形狀資料。    |
| `subroute`       |    7,049 | 4.7 MiB |  2.9 MiB | 1.7 MiB | 路線的方向和支線。                        |
| `station_group`  |    6,684 | 2.7 MiB |  1.6 MiB | 1.1 MiB | 不一定有，因為 TDX 的支援程度依城市而異。 |
| `route`          |    3,139 | 1.2 MiB |  768 KiB | 440 KiB | 路線列表資料。                            |
| `route_operator` |    3,115 | 528 KiB |  208 KiB | 288 KiB | 路線和業者的關聯。                        |

站牌相關的表約 164 MiB，路線相關的表約 6.5 MiB，路線形狀約 11 MiB，sync 紀錄不到 1 MiB。之後功能要用的表目前是空的，但還是會佔一點 metadata 的空間。

跟 7 月比，資料列只多了約 4%，資料庫卻大了約 30%。停用的資料列很少（例如 24 萬多筆路線站序裡只有 334 筆），所以多出來的空間比較可能是 sync 改寫資料列後留下的：autovacuum 會把這些空間標成可重用，但不會還回去。之後每次 sync 完，要再確認大小有沒有持續增加。

## 下一步

1. 在 local API 模式下，透過 `transitApi` 把路線頁的即時資料改成 `GET /api/realtime/routes/:uuid`，讓頁面直接顯示 API 算好的到站資訊和狀態，不用再自己比對 TDX 的資料。做完之後，路線詳情還需要附上 TDX 對應 ID 的理由，就只剩收藏。
2. 部署 API，獨立成一個改動，照 [部署](#部署) 的清單進行。
3. API 公開部署後，把正式環境的前端切到資料庫 API，並確認路線搜尋、路線詳情、路線形狀、即時資料和語言備援都跟 TDX 版本一樣。要特別注意子路線分頁的順序：API 依方向排序，TDX 則照上游的順序。

### 即時資料待決定的問題

API 的即時資料規則是從路線頁搬過來的，下面這幾種情況也照原本的行為處理。你可以決定要在前端改用 API 之前或之後調整：

- **方向未知的到站資料。** TDX 會把某些到站資料的方向標成 `255`。這些資料對不到任何子路線，所以會被忽略。台南黃幹線的全程子路線因此有 67 站裡的 20 站，看不到 TDX 其實有提供的「尚未發車，幾分後發車」。可以改成：子路線 ID 對得上就採用。
- **沒有自己到站資料的區間車。** TDX 沒有某個子路線的到站資料時，會改用整條路線的到站資料，所以可能顯示別的子路線的車。台南「白河→柳營奇美醫院」區間車就顯示了黃幹線全程車的到站時間。
- **停在「末班已過」站的車。** 正要進站的車，如果那一站的到站資料是「末班已過」，車輛也會跟著顯示這個狀態，澎湖 21 路就遇過。

API 另外修正了路線頁的一個問題：一個子路線經過同一個站兩次時，前端會在兩列都顯示第一次經過的到站時間，API 則會依站序分別對應。全台約 5% 的子路線有這種情況，等前端改用 API 的即時資料就會解決。

### TDX 額度

這個專案的長期目標是用 TDX 的免費方案（基礎會員：每把 key 每分鐘 5 次，每月 3 點，每點可以打 1,500 次或 150MB），目前用的是銅級會員（每秒 5 次，每月 200 點）。

- 基礎資料的 sync 用免費方案就夠了。2026 年 10 月執行一次路線和站牌 sync，大約打了 100 次，解壓後的回應約 175MB。
- 如果只靠 TDX，即時資料無法用免費方案支撐。每次更新要打 3 支（到站時間、靠站資訊、GPS 位置），TDX 也沒有一次拿到三種資料的 API，所以每分鐘 5 次，全部使用者加起來大概只能同時查看兩條路線。
- 正式環境的前端還在透過 proxy 向 TDX 拿基礎資料，所以要用免費方案，也得先把正式環境切到資料庫 API。
- 要讓即時資料免費，比較可行的方向是改接各縣市自己的開放資料。台北市有一份不需要 API key 的全市到站時間檔案，大約每 20 秒更新一次。要用這類資料之前，要先確認每個縣市的更新頻率、ID 怎麼對應、授權和存取限制，以及有沒有提供車輛是進站還是離站。

## 待辦

這些要等後端部署並穩定之後再做：

- **帳號和登入。** 在有登入之前，收藏和設定都留在前端，因為後端存收藏和設定的主要好處是跨裝置同步。收藏和設定的 API 等登入做完再接著做。
- **查詢單一站牌的 endpoint**，如果路線頁需要的話。
- **管理後台。** 另開一個 `apps/manager` workspace 處理 sync 的操作：列出 sync run 和狀態、看各城市的 checkpoint、TDX 用量和 sync 錯誤，以及手動觸發或重試。除了明確的 sync 操作之外都維持唯讀，對外開放前每個路由都要先加上保護。在那之前，先用 Prisma Studio 和 log。
- **共用的即時資料 cache**，例如 Redis，如果 API 之後需要執行多個 instance。
- **用 SSE 或 WebSocket 推送即時資料。**
