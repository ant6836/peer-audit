# 동종기업 재무제표 분석 웹서비스

기업을 검색해 KRX 상장사 중 **같은 업종의 동종기업**을 찾고, 각 사의
**연결재무제표 주석을 항목별로** 보고, **동종업계를 LLM으로 비교 분석**하는 웹앱입니다.
상위 폴더(`동종기업_분석`)의 CLI 파이프라인을 웹서비스로 옮기는 중입니다.

## 이번 단계에서 되는 것

- 🔍 기업명 검색(자동완성) · 점(●)으로 주석 제공 여부 표시
- 🏢 선택한 기업의 업종 표시
- 👥 같은 업종 동종기업 목록
- 📄 **연결재무제표 주석 뷰어** — 항목별 제목·표준카테고리·글자수·표수, 클릭하면 본문 펼침
- 🤖 **동종업계 비교 분석** — 주석 카테고리별로 LLM(OpenRouter)이 회사별 회계처리·공통점·기준기업 특이점·감사 주목포인트를 횡단 비교. 동종기업 선택(체크박스) · 카테고리별 개별 분석 또는 전체 분석(동시 4개).
- 🌐 **live DART 연동** — 6개 쇼케이스 외 **임의 상장사**도 DART OpenAPI에서 최신 사업보고서를 받아 연결주석을 실시간 파싱(종목코드→corp_code 번들 맵 + document.xml 압축해제 + 파서 재사용).

> 다음 단계(선택): 분석결과 MD/XLSX 다운로드 · 분석/주석 영속 캐시.

## 배포(Vercel) 환경변수 — Settings → Environment Variables

| 변수 | 값 | 용도 |
|---|---|---|
| `LLM_API_KEY` | `sk-or-v1-...` | OpenRouter 키 (비교 분석) |
| `LLM_BASE_URL` | `https://openrouter.ai/api/v1` | OpenRouter 엔드포인트 |
| `LLM_MODEL_NAME` | 사용할 모델 slug | 분석 모델 |
| `DART_API_KEY` | DART 인증키 | **임의 상장사 라이브 주석 조회**(없으면 6개 쇼케이스만) |

> `LLM_MOCK`은 **넣지 말 것**(넣으면 모의응답). 로컬은 사내망 TLS로 OpenRouter·DART 직접호출이 막혀
> `.env.local`에 `LLM_MOCK=1` + DART 키 미설정으로 픽스처/모의 검증, 실제 호출은 Vercel에서 동작.

## 데이터 출처

- `data/companies.json` — 상위 `krx_listing_desc.csv`에서 `code·name·market·industry`만 추출(2,878개사)
- `data/notes-fixtures.json` — 6개 쇼케이스 기업(하이브·에스엠·JYP·YG·큐브엔터·알비더블유)의
  연결주석을 `lib/dart/notes.ts` 파서로 미리 분해한 결과. 상위 `연결주석/_cache/*.xml`(DART 원문)에서 생성.
- `data/notes-available.json` — 주석 제공 기업 코드 목록(UI 배지용)

> 임의 기업은 향후 live DART 연동(Vercel)에서 실시간 파싱 예정. 로컬은 사내망 TLS로 DART 직접 호출이 어려워
> 현재는 캐시 기반 픽스처로 동작/검증합니다.

## 개발용 스크립트

```bash
node scripts/test-notes.ts      # 캐시 XML로 파서 검증(항목 수·카테고리 출력)
node scripts/build-fixtures.ts  # 캐시 XML → data/notes-fixtures.json 재생성
```

## 로컬 실행

```powershell
cd peer-audit-web
npm install
npm run dev
```

→ 브라우저에서 http://localhost:3000 접속.

## Vercel 배포 (처음이라면 이 순서대로)

1. **GitHub에 올리기** — 이 `peer-audit-web` 폴더를 GitHub 저장소로 push.
   ```powershell
   git init
   git add .
   git commit -m "동종기업 분석 웹서비스 MVP-0"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```
2. **Vercel 연결** — https://vercel.com 에서 GitHub 계정으로 로그인 → **Add New → Project**
   → 방금 push한 저장소 선택.
3. **설정 확인** — Framework가 자동으로 `Next.js`로 잡힘. Root Directory가 `peer-audit-web`인지 확인
   (저장소 루트에 바로 올렸다면 비워둠). 그대로 **Deploy**.
4. 1~2분 뒤 `https://<프로젝트명>.vercel.app` 공개 URL 완성 🎉

> MVP-0은 환경변수가 필요 없습니다. (DART/Anthropic 키는 다음 단계에서 추가)

## 폴더 구조

```
peer-audit-web/
├─ app/
│  ├─ page.tsx              검색 UI (클라이언트 컴포넌트)
│  ├─ layout.tsx
│  ├─ globals.css
│  └─ api/
│     ├─ search/route.ts    GET /api/search?q=  기업 검색
│     └─ peers/route.ts     GET /api/peers?code= 동종기업 조회
├─ lib/
│  └─ companies.ts          검색·동종기업 로직
├─ data/
│  └─ companies.json        KRX 상장사 슬림 데이터
└─ ...설정 파일
```
