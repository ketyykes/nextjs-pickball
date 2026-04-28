## ADDED Requirements

### Requirement: Hero 提供 `/play` 入口連結

`Hero` 元件 SHALL 在主標題與三項統計區之間（或統計區下方）渲染一個連結到 `/play` 的 CTA 元素，文案為「練習 Kitchen 規則」（或等價語意），具備可被測試識別的 `data-testid="hero-play-link"`，使用 Next.js `<Link>` 或原生 `<a href="/play">` 任一實作；連結文字 SHALL 為使用者可閱讀的文字節點（非空字串、非僅 emoji）。

#### Scenario: 首頁 Hero 顯示練習 Kitchen 規則入口連結

- **GIVEN** 使用者開啟 `/`
- **WHEN** 頁面載入完成
- **THEN** 存在 `data-testid="hero-play-link"` 元素，其 `href` 屬性為 `/play`，且包含可閱讀的繁體中文文字
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「首頁 Hero 顯示 /play 入口連結」

#### Scenario: 點擊 Hero 入口連結進入 /play

- **GIVEN** 使用者位於 `/`
- **WHEN** 點擊 `data-testid="hero-play-link"` 元素
- **THEN** 瀏覽器導向 `/play` 並顯示 StartScreen 的「開始」按鈕
- **驗收**：`tests/e2e/specs/play.spec.ts`，it 名稱「點擊 Hero 入口連結後可進入 /play 看到開始按鈕」
