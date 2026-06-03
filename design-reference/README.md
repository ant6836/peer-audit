# Design Reference (원본 자료)

레퍼런스(ElevenLabs, via Refero <https://styles.refero.design/style/031056ff-7af1-46db-8daa-115f731c5d26>)에서
내려받은 **원본 디자인 자료**를 그대로 보관하는 폴더입니다. 빌드에는 포함되지 않으며, 출처/근거(provenance)
용도와 `app/globals.css` 토큰을 맞추는 기준 자료로 씁니다.

## 여기에 둘 파일

| 파일명 | 내용 | 비고 |
|---|---|---|
| `css-variables.css` | 레퍼런스의 CSS 변수 원문 | **핵심** — globals.css 토큰을 이 값에 맞춤 |
| `design-tokens.json` | 디자인 토큰(JSON) | 선택 — 교차검증용 |

> Tailwind v4 / DESIGN.md 는 불필요(순수 CSS 사용 + DESIGN.md 보유)라 두지 않습니다.

## 적용 방식 (우리 프로젝트 각색)

원본을 그대로 쓰지 않고, 우리 정체성에 맞게 **두 가지를 치환**해 `app/globals.css`에 반영합니다.

1. **액센트 컬러**: 레퍼런스의 Signal Blue `#0447ff` / Ember `#ff4704`(아바타 점) → **PwC ember `#FD5108` 단일 액센트**
2. **폰트**: Waldenburg/Inter → 한글 대응 **Noto Serif KR / Noto Sans KR** (next/font)

색상(무채색 계열)·스페이싱·그림자·라운드·타입 스케일 등 나머지 토큰은 원본 값을 최대한 그대로 따릅니다.
