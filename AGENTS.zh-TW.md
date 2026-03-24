# 專案指南

[English](./AGENTS.md) | [繁體中文](./AGENTS.zh-TW.md)

這份文件主要是在說明這個專案怎麼組織、資料怎麼流動，以及新增或修改功能時，哪些慣例最好維持下來。

如果不確定程式該放在哪裡、資料該在哪一層整理、測試該怎麼寫，請優先依照這份指南，而不是在局部另外發展出一套新風格。

`README.md` 應該維持在產品概覽、安裝、開發和部署方式。比較偏實作慣例、團隊約定，以及 codebase 導覽的內容，則請放在 `AGENTS.md`、`AGENTS.zh-TW.md`，或是靠近程式碼的註解裡。

更新 `README.md` 時，優先保留：

- 開放資料來源
- 使用者看得到的功能
- 高層架構
- 本地開發與部署方式

除非真的有助於理解或執行專案，不然不要把低層欄位 mapping、細碎的資料重塑細節，或局部 helper 的行為塞進 README。

## 1. 專案概覽

這是一個用 React + React Router 寫的公車應用，使用 Redux Toolkit 管理 app state，並透過 RTK Query 取得公車 API 資料。

目前整個產品是以頁面為主來組織的：

- `Favorite`：我的最愛，方便快速回到常用站牌
- `Routes`：搜尋公車路線
- `Nearby`：依定位查看附近站牌
- `Route`：路線詳情
- `Settings`：語言等偏好設定

大多數功能大致上都遵循這個資料流：

1. `app/pages/` 下的 page 負責畫面層流程。
2. 可重用的 UI 抽到 `app/components/`。
3. 共用資料抓取放在 `app/modules/apis/`。
4. 跨頁或全域 state 放在 `app/modules/slices/`。
5. 領域模型則放在 `interfaces/`、`types/`、`enums/`、`consts/`。

## 2. 目錄指南

### `app/pages/`

Page 是路由層級的入口，主要負責：

- 頁面組裝
- route params 和 page state
- 資料、UI 區塊與 navigation 的協調

不要把 page 變成所有細節 renderer 的堆放區。當 page 裡開始出現一塊獨立、概念也很明確的 UI 區塊時，通常就該把它抽成 component。

### `app/components/`

這裡放可重用的 UI building block，可以是：

- 跨頁共用元件，例如輸入框、連結、modal
- 靠近 feature 的元件，例如 `app/components/nearby/`

當某一段 JSX：

- 已經長到會蓋掉 page flow
- 有自己的輸入和渲染規則
- 很明顯就是一個領域概念

通常就很值得抽成 component。

### `app/modules/apis/`

這裡負責遠端資料存取與 response transformation：

- 定義 RTK Query endpoint
- 把 raw API response 轉成 app 內部比較好用的 model
- 集中 API error handling 行為

不要把 raw API 欄位 mapping 散在各個 page 裡面。

### `app/modules/slices/`

這裡放 Redux slices。比較適合放跨頁、全域，或需要協調、持久化的 state，例如：

- geolocation
- favorite stops
- city geo
- global modal
- locale

如果某個 state 只影響單一 component 或 page，請優先用 `useState` 或 local hook，不要急著塞進 Redux。

### `app/modules/interfaces/`

這裡放可重用的物件模型與 API contract，例如：

- raw API object shape
- app 內部整理後的 model
- 像 `NearbyStopGroup`、`StationRoute` 這類 feature model

公開 model 盡量用明確的欄位型別，不要過度使用 indexed access type，除非真的有型別 plumbing 的必要。

### `app/modules/types/`

這裡放：

- 共用 type alias
- tuple
- utility type
- 非物件型的型別工具

如果它主要是一個有命名欄位的物件模型，通常還是比較適合放在 `interfaces/`。

如果某個檔案只是為了型別而引用另一個 module，請優先使用不把 module 帶進 runtime graph 的寫法，例如：

- `type LocaleShape = typeof import('../i18n/locales/zh-TW').zhTW`

### `app/modules/enums/`

這裡放穩定的 domain-level categorical values，例如：

- city
- direction
- status type

如果 enum 需要對應使用者看得到的 label，請用 colocated map，例如 `directionTranslationKeyMap`，不要把 label 字串散落在畫面各處。

### `app/modules/consts/`

這裡放靜態資料和常數 map，例如：

- city names
- area names
- direction translation keys
- geolocation messages

如果內容是行為或轉換邏輯，而不只是靜態資料，通常更適合放到 `utils/` 或某個 module。

### `app/modules/utils/`

這裡放和 rendering 無關、可重用的 pure logic。

適合放在這裡的內容包括：

- 地理查詢 helper
- enum helper
- sorting / formatting helper
- localized text fallback helper

目前 `utils/` 已經依領域分組：

- `favorite/`
- `geo/`
- `i18n/`
- `map/`
- `route/`
- `shared/`

需要在 app code 或測試裡遍歷 enum members 時，優先使用像 `getEnumValues(...)` 這類共用 helper，不要到處重寫 `Object.values(...)`。

不要太早把只在單一檔案使用、而且目前還很好懂的小邏輯抽到 `utils/`。

### `app/modules/hooks/`

這裡放跨頁或跨元件共用的 custom hook，例如：

- geolocation watching
- favorite stop behavior
- route base data / nearby data shaping

如果 hook 只屬於某一個 component，而且短期內看不出重用跡象，放在 component 旁邊也可以。

## 3. 路由與狀態架構

### Routing

Routes 定義在 `app/routes.ts`。

目前的結構是：

- `/` -> `AppLayout`
- index -> `Favorite`
- `/routes` -> `Routes`
- `/routes/:city/:id` -> `Route`
- `/nearby` -> `Nearby`
- `/settings` -> `Settings`

新增 page 時，請在 `app/routes.ts` 註冊路由，並把 page component 放在 `app/pages/`。

這個專案部署在 GitHub Pages 上，因此像是：

- `href`
- asset URL
- icon path
- 其他 URL-like 值

都必須考慮本地 base URL 和 production GitHub Pages base path 的差異。預設請使用相對路徑，不要假設 app 永遠部署在 `/`。

### Store

Redux store 定義在 `app/modules/store.ts`。

Store 比較適合用在：

- app-wide UI state
- cross-page domain state
- 需要集中協調的資料

不要把純 local rendering state 推進 Redux，除非真的有很明確的理由。

### API Data Flow

建議的資料流如下：

1. 由 `app/modules/apis/bus.ts` 發送 RTK Query request
2. 在 API layer 把 raw TDX fields 轉成 app-facing shape
3. 由 pages、hooks 和 components 消費整理後的 model

這樣做的好處是，page 可以專注在行為和畫面本身，不需要在 JSX 裡處理大量的 raw field cleanup。

當 API 支援更精準的請求時，請優先：

- 用 `$select` 只拿當前畫面需要的欄位
- 用 `$filter` 依 `RouteUID`、`StopUID`、`StationID` 等穩定識別值縮小範圍
- 在 nearby 類畫面使用 coordinate / bounding-box 過濾

不要在使用者只看單一路線或單一站點時，把整個 city / area 的資料全部拉回來，再在前端硬過濾。

### Route realtime 的資料語意

在 `Route` 頁裡：

- `EstimatedTimeOfArrival` 回答的是「這個 stop 什麼時候會被服務」
- `RealTimeNearStop` 回答的是「車現在在哪裡」

因此：

- stop list 的 ETA 文案應直接來自 `EstimatedTimeOfArrival`
- realtime bus 只應該作為 location cue，例如 plate badge 或 map marker
- 不要讓 realtime vehicle cue 覆蓋 stop ETA 本身的語意

當 realtime feed 已經顯示車輛正在路上，但 matched ETA row 仍顯示 `StopStatus = 1` 或沒有可用倒數時，請避免退回顯示 `尚未發車` 這種違反 realtime 證據的文案。

### TDX rate limit 與 proxy

這個專案的 TDX request 會透過 Cloudflare Worker proxy。

- 本地開發預設走 `VITE_PROXY_API_BASE_URL`
- 公開部署時也應該走 proxy，而不是重新暴露前端 token flow
- TDX `client_secret` 和 bearer token 都應視為敏感資訊

由於 proxy key 是多人共享，`Route` 頁的 realtime request 要注意節流與 retry/backoff，不要在初次渲染時就讓多支請求一起打爆上游。

## 4. UI 與文案規則

### 語言

面向開發者的 console 訊息使用英文，例如：

- `console.warn`
- `console.error`
- logs

面向使用者的 UI 文案，預設來源語言使用繁體中文，例如：

- alerts
- empty states
- inline warnings
- buttons、labels、helper text

對於可翻譯的靜態 UI 文案：

- 不要直接硬編碼在頁面或 shared 元件裡
- 請使用 `react-i18next` translation key
- 將來源字串維護在 `app/modules/i18n/locales/`

目前的語系規則是：

- 只支援 `zh-TW` 與 `en`
- 預設為 `zh-TW`
- locale state 存在 Redux
- locale persistence 存在 `localStorage`
- `AppI18nProvider` 會同步 `i18n` 和 `document.documentElement.lang`

對於 shared i18n helper，請優先讓 `utils/` 回傳 translation key，並在 component 或 hook 層呼叫 `t(...)`。也就是說：

- `utils/` 盡量保持 pure
- i18n 依賴要清楚地留在 render 那一層

對於 TDX-backed localized text，例如 route、subroute、stop、departure、destination：

- 不要再假設 `.zh_TW` 一定是 render 出去的值
- 應維持 locale-aware access 明確而且好讀
- 英文模式優先取 `en`
- 如果英文缺值，則回退 `zh_TW`

### UI 結構

我會比較偏好讓元件命名直接對應 domain 概念。

例如一段 JSX 如果是在表達「某站牌下的路線」，抽成 `NearbyStopRoutes` 會比留在 page 裡的一大段匿名 JSX 更清楚。

使用 Mantine 時，優先使用 Mantine 自帶的 props、variants、spacing、radius、color 和 layout primitives，而不是先手寫 `style` / `styles` 覆寫。

避免零碎、又沒有明確理由的奇數 pixel 值，例如 `11px`、`13px`。

### 渲染邏輯

如果只是很小、很一次性的段落，可以直接用 inline template rendering。

但如果某個 conditional block 已經有完整結構和領域意義，優先抽成有名稱的小 component，而不是先塞進 local `ReactNode` 變數再插回 JSX。

對於重複的結構，優先使用 data-driven `map` rendering；但不要把只有一兩個欄位的畫面也硬做成 map，反而讓可讀性變差。

當同一區塊還在渲染 loading skeleton 時，不要同時顯示 empty-state 或 no-data 訊息。

## 5. 模型與檔案放置規則

快速判斷如下：

- 可重用物件模型：`app/modules/interfaces/`
- 可重用 alias / tuple / union / utility type：`app/modules/types/`
- enum 類別：`app/modules/enums/`
- enum label map / static lookup：`app/modules/consts/`
- pure helper logic：`app/modules/utils/`
- 共用行為 hook：`app/modules/hooks/`
- feature UI block：`app/components/<feature>/`
- screen entry point：`app/pages/`

如果型別真的只屬於單一元件，就留在該元件檔案裡即可。

## 6. 測試指南

小型 module / util 優先使用 colocated `*.test.ts`。

全專案統一使用：

- `*.test.ts`
- `*.test.tsx`

不要混用 `*.spec.*`。

測試優先順序是：

- app logic
- user-visible behavior
- component contract

對 util，優先寫 focused unit test。

對 React component，優先測：

- state branch
- user interaction
- parent-child contract

避免把測試綁死在：

- 第三方 library DOM 結構
- generated class names
- animation 細節
- map library internals

目前共用的測試基礎設施有：

- `app/test/setup.ts`
- `app/test/render.tsx`
- `app/test/createTestStore.ts`
- `app/test/mockMatchMedia.ts`

請優先重用這些 provider / environment helper，但不要把 scenario-specific state、mock data、user action 藏進過於肥大的 helper 裡。

對 i18n 和共享文案相關的測試，優先：

- 引用既有的 translation resource、message helper 或 `i18n.t(...)`
- 避免把共享 UI 文案直接硬寫在測試裡
- 讓測試對真正的產品文案 contract 有依據，但也不要讓測試過度依賴純格式層面的細節

## 7. Commit 規則

請使用慣例式提交：

`<type>[optional scope]: <description>`

常見類型包括：

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `build`
- `ci`
- `style`
- `perf`

如果 scope 有幫助，可以加上：

- `fix(nearby): ...`
- `refactor(i18n): ...`

如果是 AI agent 建立 commit，請一定要加 body，清楚說明這次 commit 具體改了什麼。

這個 repo 目前有 Husky hooks：

- `pre-commit`：`pnpm run lint` + `pnpm run typecheck`
- `commit-msg`：檢查 Conventional Commit header
- `pre-push`：`pnpm run test`

## 8. 工作風格期待

修改這個專案時，請盡量遵守下面這些原則：

- 儘量保留既有結構，除非真的有明確的架構理由需要改善
- 偏好小而有名稱的元件，而不是很長的匿名 JSX block
- 資料轉換盡量靠近 API layer
- page 檔案應維持在 screen flow 層級
- 可讀性優先於過度聰明的抽象
- 如果有小型、低風險，而且能在當前任務順手完成的 cleanup，優先直接完成，不要都留成未來 todo

當引入新的 pattern 時，它應該讓下一個維護者更容易理解整體 codebase，而不只是把眼前這個檔案寫短。

當單一檔案接近或超過約 300 行時，請停下來判斷是不是該抽出：

- 有名字的元件
- feature-specific hook
- pure utility

這不是硬性限制，但它是一個很好用的可讀性訊號。
