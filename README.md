# 동종기업 분석 웹서비스 — MVP-0

기업을 검색하면 KRX 상장사 중 **같은 업종의 동종기업**을 찾아주는 웹앱입니다.
상위 폴더(`동종기업_분석`)의 CLI 파이프라인을 웹서비스로 옮기는 첫 단계(MVP-0)로,
**외부 API 없이** 정적 데이터만으로 동작하므로 Vercel 배포가 가장 단순합니다.

## 이번 단계에서 되는 것

- 🔍 기업명 검색(자동완성)
- 🏢 선택한 기업의 업종 표시
- 👥 같은 업종 동종기업 목록

> 다음 단계 예정: 주석 파싱(MVP-1) → LLM 동종업계 비교 분석(MVP-2). 분석 단계의 LLM은
> 배포본에서 공개 Anthropic API, 로컬에서는 PwC GenAI를 쓰도록 어댑터로 분기할 예정입니다.

## 데이터 출처

`data/companies.json` — 상위 `krx_listing_desc.csv`(1단계 산출물)에서
`code·name·market·industry` 4개 컬럼만 추출한 슬림본(2,878개사).

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
