// DART OpenAPI 라이브 연동 — 03_build_notes.py / dart_report.py 의 흐름을 TS로 포팅.
// 종목코드 → corp_code(번들 맵) → 최신 사업보고서(list.json) → document.xml(ZIP) → 연결주석 파싱.
// DART_API_KEY 환경변수 필요. 로컬은 사내망 TLS로 직접호출 불가 → Vercel에서 동작.
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

// 인스턴스 메모리 캐시 (DART 재호출·재파싱 방지). null = 시도했으나 없음.
// 진행 중 Promise도 캐시해 동시 요청이 같은 보고서를 중복 다운로드하지 않게 한다.
const liveCache = new Map<string, CompanyNotes | null>();
const inflight = new Map<string, Promise<CompanyNotes | null>>();

/** DART에서 해당 종목의 연결주석을 실시간으로 가져와 파싱. 실패 시 null. */
export async function fetchLiveNotes(stock: string, name: string): Promise<CompanyNotes | null> {
  if (liveCache.has(stock)) return liveCache.get(stock)!;
  const pending = inflight.get(stock);
  if (pending) return pending; // 동시 요청 합치기

  const p = (async (): Promise<CompanyNotes | null> => {
    const key = process.env.DART_API_KEY?.trim();
    const corp = corpCodeOf(stock);
    if (!key || !corp) return null;

    try {
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
      // 대표 문서는 '{rcept_no}.xml'. 없으면 가장 큰 파일.
      let main = names.find((n) => n === `${rep.rcept_no}.xml`);
      if (!main) main = names.sort((a, b) => files[b].length - files[a].length)[0];
      const xml = strFromU8(files[main]);

      // 3) 연결주석 파싱
      const items = parseConsolidatedNotes(xml);
      return { name, rcept: rep.rcept_no, items, source: "live" };
    } catch {
      return null;
    }
  })();

  inflight.set(stock, p);
  const result = await p;
  liveCache.set(stock, result);
  inflight.delete(stock);
  return result;
}
