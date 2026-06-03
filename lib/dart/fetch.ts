// DART OpenAPI 라이브 연동 — 03_build_notes.py / dart_report.py 의 흐름을 TS로 포팅.
// 종목코드 → corp_code(번들 맵) → 최신 사업보고서(list.json) → document.xml(ZIP) → 연결주석 파싱.
// DART_API_KEY 환경변수 필요. 로컬은 사내망 TLS로 직접호출 불가 → Vercel에서 동작.
import { unstable_cache } from "next/cache";
import { unzipSync, strFromU8 } from "fflate";
import corpcodes from "@/data/corpcodes.json";
import { parseConsolidatedNotes } from "@/lib/dart/notes";
import type { CompanyNotes } from "@/lib/dart/store";

const CODES = corpcodes as Record<string, string>;
const LIST_URL = "https://opendart.fss.or.kr/api/list.json";
const DOC_URL = "https://opendart.fss.or.kr/api/document.xml";

/** 종목코드 → 8자리 corp_code. 비상장/미수록이면 null. */
export function corpCodeOf(stock: string): string | null {
  return CODES[stock] ?? null;
}

/** 상장사(corpCode 맵 수록) 여부. */
export function isListed(stock: string): boolean {
  return stock in CODES;
}

// 타임아웃 있는 fetch (느린 DART 응답이 함수 전체를 멈추지 않도록)
async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 실제 DART 조회·파싱. 실패 시 throw (→ 캐시에 저장되지 않음).
async function fetchLiveNotesRaw(stock: string, name: string): Promise<CompanyNotes> {
  const key = process.env.DART_API_KEY?.trim();
  const corp = corpCodeOf(stock);
  if (!key) throw new Error("DART_API_KEY 미설정");
  if (!corp) throw new Error("corp_code 없음(비상장/미수록)");

  // 1) 최신 사업보고서(A001)의 접수번호
  const listUrl =
    `${LIST_URL}?crtfc_key=${key}&corp_code=${corp}` +
    `&bgn_de=20220101&end_de=20261231&pblntf_detail_ty=A001&page_count=10&sort=date&sort_mth=desc`;
  const list = await (await fetchWithTimeout(listUrl, 12_000)).json();
  if (list.status !== "000") throw new Error(`list.json status=${list.status}`);
  const rep = (list.list ?? []).find((it: { report_nm?: string }) =>
    (it.report_nm ?? "").includes("사업보고서")
  );
  if (!rep) throw new Error("사업보고서 없음");

  // 2) document.xml(ZIP) 다운로드 → 대표 XML 추출
  const docRes = await fetchWithTimeout(`${DOC_URL}?crtfc_key=${key}&rcept_no=${rep.rcept_no}`, 35_000);
  const buf = new Uint8Array(await docRes.arrayBuffer());
  const files = unzipSync(buf);
  const names = Object.keys(files);
  let main = names.find((n) => n === `${rep.rcept_no}.xml`);
  if (!main) main = names.sort((a, b) => files[b].length - files[a].length)[0];
  const xml = strFromU8(files[main]);

  // 3) 연결주석 파싱 — 항목 텍스트는 6000자로 캡(캐시 크기·LLM 입력 안정화)
  const items = parseConsolidatedNotes(xml).map((it) =>
    it.text.length > 6000 ? { ...it, text: it.text.slice(0, 6000) + " …(생략)" } : it
  );
  return { name, rcept: rep.rcept_no, items, source: "live" };
}

// Next.js Data Cache(Vercel 영속·인스턴스 공유)로 감싼다 — 한 번 받은 보고서를 재사용해
// 카테고리별 POST마다 재다운로드(→504)하지 않게 한다. 성공만 캐시(throw는 캐시 안 됨).
const cachedFetch = unstable_cache(
  (stock: string, name: string) => fetchLiveNotesRaw(stock, name),
  ["dart-live-notes-v1"],
  { revalidate: 86400 } // 보고서는 잘 안 바뀜 → 1일
);

/** DART 라이브 연결주석. 실패/없음 시 null. 성공 결과는 영속 캐시. */
export async function fetchLiveNotes(stock: string, name: string): Promise<CompanyNotes | null> {
  try {
    return await cachedFetch(stock, name);
  } catch {
    return null;
  }
}
