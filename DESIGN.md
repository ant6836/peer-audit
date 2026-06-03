# 동종기업 분석 — Design System

> Editorial vellum with a single ember accent — light Noto Serif KR headlines on a warm eggshell ground, achromatic grays for structure, and PwC ember `#FD5108` reserved as the one true color for interaction.

**Theme:** light · **Base reference:** ElevenLabs style (`DESIGN_example.md`), 우리 프로젝트용으로 각색

이 문서는 `DESIGN_example.md`(ElevenLabs 레퍼런스)의 **에디토리얼·타입 우선·저채도** 철학과 섹션 구조를 그대로 이어받되, 두 가지를 우리 것으로 바꾼 버전입니다.

1. **브랜드 액센트** — 레퍼런스의 무채색 규율은 유지하되, 유일한 컬러 포인트를 PwC 브랜딩 컬러 **`#FD5108` (Ember)** 로 지정. 텍스트는 검정, 배경은 에그셸, 상호작용(주요 버튼·포커스·선택·링크·강조)에만 ember를 쓴다.
2. **한글 대응 폰트** — 레퍼런스의 라이트 세리프(Waldenburg 300)는 한글 글리프가 없으므로 **Noto Serif KR 300/400** 으로 대체(가벼운 클래식 세리프 느낌을 한글에서도 유지). 본문은 **Noto Sans KR**.

핵심 인상: PwC 감사 도구다운 **절제된 권위**. 거의-흰색 위에 검정 세리프가 무겁게 내려앉고, ember 오렌지가 "여기를 누르세요"라고 한 군데씩만 속삭인다. 채도는 거의 0, 컬러는 ember 하나뿐.

## Colors

| Name | Value | Role |
|------|-------|------|
| Eggshell | `#fdfcfc` | 페이지 배경·기본 surface. 순백(#fff)이 아닌 따뜻한 거의-흰색이라 검정 타입이 더 묵직하게 앉는다 |
| Powder | `#f5f3f1` | 보조 surface, hover, 선택 row 배경, 미묘한 섹션 구분 |
| Chalk | `#e5e5e5` | 모든 보더·구분선·카드 아웃라인 — 보더 색은 이 하나로 통일 |
| Fog | `#b1b0b0` | 비활성·플레이스홀더·로고그리드 그레이스케일 |
| Gravel | `#6b6660` | 보조 본문·내비·캡션·서브헤딩 — 따뜻한 돌빛 회색(차가운 회색 금지) |
| Obsidian | `#141414` | 주요 텍스트·헤드라인·로고 워드마크. 에그셸 대비 고대비 |
| **Ember** | **`#FD5108`** | **PwC 브랜드 액센트. 유일한 컬러.** 주요 CTA 채움, 포커스 링, 선택/활성 상태, 링크, eyebrow 라벨, 강조 수치 |
| Ember Wash | `#FFF1EA` | ember의 극히 옅은 틴트 — 선택 row·강조 배지의 은은한 배경 |
| Ember Deep | `#D8430A` | ember hover/press 시 약간 어둡게 |

> **규율:** ember(`#FD5108`)는 *상호작용과 강조*에만. 본문 텍스트·큰 면적 배경을 ember로 채우지 말 것. 무채색 위에 한 점씩 떨어지는 불씨처럼 쓴다.

## Typography

### Noto Serif KR — 디스플레이·섹션 헤드라인 (Waldenburg 300 대체)
한글까지 커버하는 가벼운 클래식 세리프. **weight 300**이 시그니처 — AI/SaaS의 굵은 산세리프 관행을 뒤집어 절제로 권위를 만든다. 큰 사이즈에서 -0.02em 트래킹으로 자간을 좁혀 약간 고전적으로 기울인다.
- **Weights:** 300, 400
- **Sizes:** 28px, 36px, 44px
- **Line height:** 1.1–1.2
- **Letter spacing:** -0.02em (큰 헤드라인)

### Noto Sans KR — 본문·UI 라벨·내비·버튼·캡션·테이블 (Inter 대체)
weight 400 본문, 500 상호작용 라벨·강조. 작은 크기에서도 한글 가독성 유지.
- **Weights:** 400, 500, 700
- **Sizes:** 12px, 13px, 14px, 15px, 16px, 18px, 20px
- **Line height:** 1.4–1.6

### Type Scale

| Role | Size | Line Height | Letter Spacing | Font |
|------|------|-------------|----------------|------|
| caption | 12px | 1.4 | — | Sans |
| body | 14px | 1.5 | — | Sans |
| body-lg | 16px | 1.6 | — | Sans |
| subheading | 18px | 1.5 | — | Sans |
| heading-sm | 20px | 1.4 | — | Sans 500 |
| eyebrow | 13px | 1.4 | 0.08em (대문자) | Sans 500 |
| heading | 28px | 1.2 | -0.02em | Serif 300 |
| heading-lg | 36px | 1.15 | -0.02em | Serif 300 |
| display | 44px | 1.1 | -0.02em | Serif 300 |

## Spacing & Layout

**Base unit:** 4px · **Density:** comfortable

- **Page max-width:** 880–1080px (분석 도구라 본문폭 다소 좁게)
- **Section gap:** 48–80px
- **Card padding:** 24–28px
- **Element gap:** 8–12px

### Border Radius
- **buttons / pills / tags:** 9999px
- **cards / panels:** 16px
- **badges:** 10px
- **inputs:** 10px (레퍼런스는 0px였으나, 검색 중심 앱이라 라운드 입력으로 친근감 부여)

## Components

### Top Navigation (로고 좌측 상단)
배경 Eggshell, 높이 56–64px, max-width 정렬. **`logo.png`(PwC 로고)를 좌측 끝에 배치** — height 32–36px, 세로 중앙 정렬. 우측엔 가벼운 단계 배지(예: `MVP-0`)나 비워둠. 스크롤 시 하단 1px Chalk 보더.

### Primary Pill Button (Filled) — Ember
주요 CTA(분석 시작 등). 배경 **`#FD5108`**, 텍스트 #fff, radius 9999px, padding 0 20px, height ~40px. hover 시 Ember Deep `#D8430A`. 그림자는 헤어라인만. 한 화면에 하나만.

### Ghost Pill Button (Outline)
보조 액션. 배경 #fff, 텍스트 Obsidian, border 1px Chalk, radius 9999px. hover 시 보더가 ember로 전환.

### Search Input (Contained)
배경 #fff, border 1px Chalk, radius 10px, padding 14px 16px, text 16px. **focus 시 border `#FD5108` + ember 3px soft ring**(`0 0 0 3px rgba(253,81,8,0.15)`). 플레이스홀더 Fog.

### Autocomplete Dropdown
배경 #fff, radius 12px, 헤어라인 그림자. 항목 hover/active 시 배경 Powder. 종목코드·시장은 우측에 Fog 색 태그. 활성 항목 좌측에 **ember 2px 인디케이터 바**.

### Company Card
배경 #fff(에그셸 위로 살짝 뜨는 카드), radius 16px, padding 24–28px, 헤어라인 그림자. 회사명은 **Noto Serif KR 300, 28px, Obsidian**. 업종은 eyebrow 스타일(**ember 색, 대문자 트래킹**). 동종기업 수는 ember로 강조한 숫자 + Gravel 보조어.

### Eyebrow Label
헤딩 위 작은 분류 라벨. Noto Sans KR 500 13px, **`#FD5108`**, 0.08em 트래킹, 대문자(영문). 배경·보더 없음.

### Data Table (동종기업 목록)
에디토리얼 표. 헤더 Gravel 13px(대문자), 셀 14px Obsidian. 행 구분선은 Chalk 1px만(세로선 없음). row hover 시 배경 Powder. 종목코드는 tabular-nums.

### Tag / Badge
시장·코드 등 메타. radius 9999px, 배경 Powder, 텍스트 Gravel 12px. 브랜드 강조 배지에 한해 배경 Ember Wash `#FFF1EA` + 텍스트 Ember.

## Elevation
헤어라인 엘리베이션만 사용. 카드는 `0 0 1px rgba(0,0,0,0.18)` + `0 2px 4px rgba(0,0,0,0.04)` 로 *떠 있다기보다 살짝 들린* 느낌. 깊은 그림자 금지 — 모든 요소를 같은 평면에 둬 타입 우선의 의도를 지킨다.

## Do's and Don'ts

### Do
- 헤드라인(28px↑)은 **Noto Serif KR 300** + -0.02em 트래킹. 굵은 weight로 대체하지 말 것.
- 컬러는 **ember `#FD5108` 하나만**. 텍스트=Obsidian, 배경=Eggshell, 보더=Chalk, 보조텍스트=Gravel로 무채색 유지.
- ember는 상호작용/강조에만: 주요 버튼 채움, 포커스 링, 선택·활성, 링크, eyebrow, 강조 수치.
- 좌측 상단에 **`logo.png`** 를 height 32–36px로 또렷하게. 로고를 늘리거나 색을 바꾸지 말 것.
- 카드·입력은 라운드(10–16px), 버튼·태그는 pill(9999px).
- 섹션 간격 48–80px, 요소 간격 8–12px.

### Don't
- ember를 본문 텍스트나 넓은 배경 채움에 쓰지 말 것 — 액센트는 점으로만.
- 두 번째 채도 컬러(파랑·초록 등)를 새로 들이지 말 것. 컬러는 ember 단 하나.
- 깊은 그림자/강한 엘리베이션 금지 — 헤어라인까지만.
- 순백(#ffffff)을 페이지 배경으로 쓰지 말 것. 페이지 ground는 Eggshell `#fdfcfc`.
- 한 묶음 안에 버튼 변형 3개 이상 금지 — ember 필드 1 + 고스트 1 까지.
- 헤드라인에 산세리프(굵은) 쓰지 말 것 — 세리프 라이트가 시그니처.

## Surfaces
- **Page Ground** `#fdfcfc` — 모든 페이지 콘텐츠의 바탕
- **Powder** `#f5f3f1` — hover·활성 row·섹션 강조
- **Card White** `#ffffff` — 카드·입력처럼 에그셸 위로 떠야 하는 면
- **Ember Wash** `#FFF1EA` — 선택/강조의 은은한 ember 배경

## Imagery
타입 우선. 사진·일러스트 없음. 유일한 그래픽 자산은 좌측 상단 **PwC 로고(`logo.png`)** 와, 데이터(테이블·수치) 그 자체. 인포그래픽이 곧 이미지다.

## Similar Brands
- **Anthropic** — 라이트 세리프 헤드라인 + 따뜻한 오프화이트, 절제된 컬러
- **Linear / Vercel** — 무채색 규율 + 단일 액센트를 UI 인터랙션에만 한정
- **Notion** — 에그셸 그라운드 + 에디토리얼 타입 우선 레이아웃
