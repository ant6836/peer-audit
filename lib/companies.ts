// 기업 검색 + 동종기업(같은 업종) 조회 로직.
// 데이터 출처: 상위 파이프라인 1단계 산출물(krx_listing_desc.csv)을 슬림 JSON으로 변환한 것.
// MVP-0 은 외부 API 없이 이 정적 데이터만으로 동작한다.
import companiesData from "@/data/companies.json";

export interface Company {
  code: string; // 종목코드 (6자리)
  name: string; // 회사명
  market: string; // KOSPI / KOSDAQ / KONEX
  industry: string; // 업종 (KRX Industry)
}

const COMPANIES = companiesData as Company[];

// 검색 매칭용 정규화: 공백 제거 + 소문자 (영문 회사명 대응)
function norm(s: string): string {
  return s.replace(/\s+/g, "").toLowerCase();
}

/**
 * 회사명으로 검색. 정확히 일치 → 앞부분 일치 → 부분 포함 순으로 우선순위를 매겨 정렬.
 * @param query 검색어
 * @param limit 최대 결과 수
 */
export function searchCompanies(query: string, limit = 10): Company[] {
  const q = norm(query);
  if (!q) return [];

  const scored: { c: Company; score: number }[] = [];
  for (const c of COMPANIES) {
    const n = norm(c.name);
    let score = -1;
    if (n === q) score = 0; // 정확히 일치
    else if (n.startsWith(q)) score = 1; // 앞부분 일치
    else if (n.includes(q)) score = 2; // 부분 포함
    if (score >= 0) scored.push({ c, score });
  }

  scored.sort((a, b) => a.score - b.score || a.c.name.localeCompare(b.c.name, "ko"));
  return scored.slice(0, limit).map((s) => s.c);
}

/** 종목코드로 기업 1개 조회. 없으면 null. */
export function getCompanyByCode(code: string): Company | null {
  return COMPANIES.find((c) => c.code === code) ?? null;
}

/**
 * 같은 업종(Industry)의 동종기업 목록. 기준 기업은 제외.
 * @returns 기준기업·업종·동종기업 목록. 기준 기업이 없으면 null.
 */
export function getPeers(
  code: string
): { base: Company; industry: string; peers: Company[] } | null {
  const base = getCompanyByCode(code);
  if (!base) return null;

  const peers = COMPANIES.filter(
    (c) => c.industry === base.industry && c.code !== base.code
  ).sort((a, b) => a.market.localeCompare(b.market) || a.name.localeCompare(b.name, "ko"));

  return { base, industry: base.industry, peers };
}
