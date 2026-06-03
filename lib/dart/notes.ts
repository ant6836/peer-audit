// DART 사업보고서 원문(XML)에서 '연결재무제표 주석'을 항목별로 분해한다.
// 원본 파이프라인 03_build_notes.py 의 파싱 로직을 TypeScript로 1:1 포팅.
// 순수 함수(네트워크 없음) — XML 문자열만 받아 항목 배열을 반환한다.

export interface NoteItem {
  num: number; // 주석 항목 번호 (N.)
  title: string; // 원제목
  clean: string; // (연결/별도/개별) 꼬리표 제거한 제목
  category: string; // 표준 카테고리
  chars: number; // 본문 글자수
  tables: number; // 표 개수
  text: string; // 본문(표는 마크다운)
}

// 공백 제거 정규화 (한/영 회사명·표제 매칭용)
function norm(s: string): string {
  return s.replace(/\s+/g, "");
}

// 회사마다 다른 주석 표제를 비교 가능한 표준 카테고리로 묶는 키워드 규칙.
// (위에서부터 먼저 매치되는 규칙 채택 — 회계 흐름 순서)
const CATEGORY_RULES: [string, string[]][] = [
  ["회사의 개요·일반사항", ["개요", "일반사항"]],
  ["작성기준·중요한 회계정책", ["회계정책", "작성기준"]],
  ["중요한 회계추정 및 가정", ["회계추정"]],
  ["재무위험·자본관리", ["재무위험관리", "위험관리", "자본관리"]],
  ["범주별 금융상품", ["범주별"]],
  ["공정가치 측정", ["공정가치"]],
  ["현금및현금성자산", ["현금및현금성", "현금성"]],
  ["매출채권·기타채권", ["매출채권"]],
  ["선급금", ["선급금"]],
  ["재고자산", ["재고자산"]],
  ["기타금융자산", ["기타금융자산", "장ㆍ단기금융자산", "단기금융자산"]],
  ["기타자산", ["기타자산"]],
  ["관계·공동기업 투자", ["관계기업", "공동기업"]],
  ["투자부동산", ["투자부동산"]],
  ["유형자산", ["유형자산"]],
  ["무형자산", ["무형자산"]],
  ["리스·사용권자산", ["리스", "사용권자산"]],
  ["차입금·사채", ["차입", "사채"]],
  ["파생상품", ["파생"]],
  ["매입채무·기타금융부채", ["매입채무", "기타금융부채"]],
  ["기타부채", ["기타부채"]],
  ["충당부채", ["충당부채"]],
  ["종업원급여·퇴직급여", ["종업원급여", "퇴직급여", "확정급여", "급여부채"]],
  ["법인세", ["법인세"]],
  ["자본금·자본잉여금", ["자본금", "자본잉여금"]],
  ["주식기준보상", ["주식기준보상"]],
  ["기타자본·기타포괄손익", ["기타자본", "기타포괄손익", "자본조정", "자본구성", "기타자본구성"]],
  ["이익잉여금·결손금", ["이익잉여금", "결손금"]],
  ["고객계약 수익·매출", ["고객과의계약", "매출액"]],
  ["판매비와관리비", ["판매비"]],
  ["비용의 성격별 분류", ["성격별"]],
  ["금융수익·금융비용", ["금융수익", "금융원가", "순금융"]],
  ["기타수익·기타비용", ["기타수익", "기타영업수익", "기타비용", "기타영업비용"]],
  ["주당손익", ["주당"]],
  ["영업창출 현금흐름", ["창출", "현금흐름표"]],
  ["우발채무·약정", ["우발", "약정"]],
  ["특수관계자", ["특수관계자"]],
  ["영업부문", ["영업부문"]],
  ["사업결합", ["사업결합"]],
  ["계약자산·부채", ["계약자산", "계약과관련된"]],
  ["매각예정자산", ["매각예정"]],
  ["중단영업", ["중단영업"]],
  ["배당금", ["배당"]],
  ["보고기간 후 사건", ["보고기간후", "후사건"]],
];

// 표준 카테고리 정렬 순서(회계 흐름) — 비교 분석에서 카테고리 정렬에 사용
export const CATEGORY_ORDER: string[] = CATEGORY_RULES.map(([cat]) => cat);

// 주석 표제 → 표준 카테고리. 매칭 실패 시 '기타: 원제목'.
function categorize(title: string): string {
  const n = norm(title.replace(/\((연결|별도|개별)\)/g, ""));
  for (const [cat, kws] of CATEGORY_RULES) {
    if (kws.some((kw) => n.includes(norm(kw)))) return cat;
  }
  return `기타: ${title}`;
}

// <TITLE> 태그 위치·텍스트 추출 → [위치, 제목][]
function titlesOf(text: string): [number, string][] {
  const out: [number, string][] = [];
  const re = /<TITLE[^>]*>([\s\S]*?)<\/TITLE>/g;
  for (const m of text.matchAll(re)) {
    const t = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (t) out.push([m.index!, t]);
  }
  return out;
}

// DART 병합표를 마크다운 표로 변환.
// 종료태그 누락·중첩에 견고하도록 셀 '시작 태그'(<TD>/<TE>/<TH>) 기준으로 분할.
function tableToMarkdown(tableHtml: string): string {
  const rows: string[][] = [];
  for (const tr of tableHtml.match(/<TR\b[\s\S]*?<\/TR>/gi) ?? []) {
    const cells: string[] = [];
    const parts = tr.split(/<T[DHE]\b[^>]*>/).slice(1); // 각 셀 시작 태그로 분할
    for (const part of parts) {
      const m = part.match(/<\/T[DHE]>/i);
      const content = m ? part.slice(0, m.index) : part; // 종료태그 전까지가 셀 내용
      // 진짜 태그(라틴/! 시작)만 제거 — <당기말> 같은 한글 꺾쇠 텍스트는 보존
      let txt = content.replace(/<\/?[A-Za-z!][^>]*>/g, " ");
      txt = txt.replace(/&[a-zA-Z#0-9]+;/g, " ");
      txt = txt.replace(/\s+/g, " ").trim();
      cells.push(txt.replace(/\|/g, "\\|"));
    }
    if (cells.some((c) => c)) rows.push(cells);
  }
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const padded = rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
  const md = [
    "| " + padded[0].join(" | ") + " |",
    "| " + Array(width).fill("---").join(" | ") + " |",
  ];
  for (const r of padded.slice(1)) md.push("| " + r.join(" | ") + " |");
  return md.join("\n");
}

// 한 섹션 → (표 개수, 평문). 표는 마크다운으로 보존.
// DART는 레이아웃용으로 표를 중첩하므로(바깥=레이아웃, 안=데이터), '가장 안쪽 표'만
// 데이터 표로 인식한다. 바깥 레이아웃 표의 서술 텍스트는 태그만 제거돼 일반 문단이 된다.
// 안쪽 표 → 바깥 표 순으로 여러 단계도 처리되도록 더 이상 안쪽 표가 없을 때까지 반복.
function toPlain(section: string): [number, string] {
  const tables: string[] = [];
  // 내부에 <TABLE>를 포함하지 않는 표(=가장 안쪽 데이터 표)만 1회 매칭.
  // (단일 패스여야 함 — 반복하면 바깥 레이아웃 표가 '안쪽'이 되어 다시 표로 잡힘)
  // 바깥 레이아웃 표 태그는 아래 태그 제거 단계에서 사라져 서술이 일반 문단이 된다.
  const INNER = /<TABLE\b(?:(?!<TABLE\b)[\s\S])*?<\/TABLE>/gi;
  let s = section.replace(INNER, (m) => {
    const md = tableToMarkdown(m);
    if (!md) return " ";
    tables.push(md);
    return `\x00T${tables.length - 1}\x00`;
  });
  // 블록 경계(문단·줄바꿈)는 줄바꿈으로 보존
  s = s.replace(/<\/p>|<br\s*\/?>|<\/title>|<\/li>|<\/div>/gi, "\n");
  // 진짜 태그(라틴/! 시작)만 제거 — <당기말> 같은 한글 꺾쇠는 보존
  s = s.replace(/<\/?[A-Za-z!][^>]*>/g, " ");
  s = s.replace(/&[a-zA-Z#0-9]+;/g, " ");
  // 줄바꿈은 유지하고 그 외 공백만 한 칸으로 압축
  s = s.replace(/[^\S\n]+/g, " ");
  // 줄별 트림 + 과도한 빈 줄(3줄 이상)은 한 줄로 정리
  s = s.split("\n").map((l) => l.trim()).join("\n").replace(/\n{3,}/g, "\n\n");
  // 표 placeholder 복원
  s = s.replace(/\x00T(\d+)\x00/g, (_, i) => "\n\n" + tables[Number(i)] + "\n\n");
  return [tables.length, s.replace(/\n{3,}/g, "\n\n").trim()];
}

// 연결재무제표 주석 구간의 [시작, 끝] 위치를 찾는다.
function consolNotesSpan(
  text: string,
  titles: [number, string][]
): [number | null, number | null] {
  let start: number | null = null;
  for (const [pos, t] of titles) {
    if (norm(t).includes("연결재무제표주석")) {
      start = pos;
      break;
    }
  }
  if (start === null) return [null, null];
  let end = text.length;
  for (const [pos, t] of titles) {
    if (pos <= start) continue;
    const n = norm(t);
    if (n.includes("연결")) continue;
    if (n.endsWith("재무제표") || n.includes("재무제표주석") || n.includes("재무상태표")) {
      end = pos;
      break;
    }
  }
  return [start, end];
}

// 연결주석 구간 내부의 'N.' 번호 항목을 분해.
function splitItems(
  text: string,
  start: number,
  end: number,
  titles: [number, string][]
): NoteItem[] {
  const inside = titles.filter(([pos]) => start <= pos && pos < end);
  let itemTitles: [number, number, string][] = [];
  let anchorDone = false;
  for (const [pos, t] of inside) {
    const m = t.match(/^(\d+)\.\s*(.+)$/);
    if (!m) continue;
    if (!anchorDone && norm(t).includes("연결재무제표주석")) {
      anchorDone = true; // 앵커('3. 연결재무제표 주석') 자체는 항목 아님
      continue;
    }
    itemTitles.push([pos, Number(m[1]), m[2].trim()]);
  }

  // fallback: TITLE 기반 항목이 너무 적으면 본문 SPAN/P 패턴으로 (알비더블유 등)
  if (itemTitles.length < 3) {
    const span = text.slice(start, end);
    itemTitles = [];
    let prev = 0;
    const re = /<(?:SPAN|P)[^>]*>\s*(\d{1,2})\.\s*([가-힣A-Za-z][^<]{1,28})\s*<\/(?:SPAN|P)>/g;
    for (const m of span.matchAll(re)) {
      const num = Number(m[1]);
      const title = m[2].replace(/\s+/g, " ").trim();
      if (norm(title).includes("연결재무제표주석")) continue;
      if (num > prev) {
        // 번호 단조증가만 채택(본문 중간의 'N.' 노이즈 배제)
        itemTitles.push([start + m.index!, num, title]);
        prev = num;
      }
    }
  }

  const items: NoteItem[] = [];
  for (let i = 0; i < itemTitles.length; i++) {
    const [pos, num, title] = itemTitles[i];
    const segEnd = i + 1 < itemTitles.length ? itemTitles[i + 1][0] : end;
    const [ntab, plain] = toPlain(text.slice(pos, segEnd));
    const clean = title.replace(/\s*\((연결|별도|개별)\)\s*$/, "").trim();
    items.push({
      num,
      title,
      clean,
      category: categorize(title),
      chars: plain.length,
      tables: ntab,
      text: plain,
    });
  }
  return items;
}

/**
 * 사업보고서 원문 XML → 연결재무제표 주석 항목 배열.
 * 연결주석 구간이 없으면 빈 배열.
 */
export function parseConsolidatedNotes(xmlText: string): NoteItem[] {
  const titles = titlesOf(xmlText);
  const [start, end] = consolNotesSpan(xmlText, titles);
  if (start === null || end === null) return [];
  return splitItems(xmlText, start, end, titles);
}
