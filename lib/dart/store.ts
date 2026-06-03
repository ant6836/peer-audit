// 연결주석 데이터 접근 계층.
// 우선순위: 번들 픽스처(6개 쇼케이스, 즉시) → DART 라이브(상장사, DART_API_KEY 있을 때).
import fixtures from "@/data/notes-fixtures.json";
import availableCodes from "@/data/notes-available.json";
import corpcodes from "@/data/corpcodes.json";
import type { NoteItem } from "@/lib/dart/notes";
import { fetchLiveNotes } from "@/lib/dart/fetch";

export interface CompanyNotes {
  name: string;
  rcept: string; // 접수번호
  items: NoteItem[];
  source?: "fixture" | "live";
}

const FIXTURES = fixtures as unknown as Record<string, CompanyNotes>;
const AVAILABLE = new Set(availableCodes as string[]);
const CODES = corpcodes as Record<string, string>;

const hasDart = () => !!process.env.DART_API_KEY?.trim();

/** 주석 데이터를 얻을 수 있는 기업인지 (UI 배지·선택 가능 여부). 동기. */
export function hasNotes(code: string): boolean {
  return AVAILABLE.has(code) || (hasDart() && code in CODES);
}

/**
 * 연결주석 조회. 픽스처 우선, 없으면 DART 라이브(키 있을 때). 없으면 null.
 * @param name 라이브 결과에 표기할 회사명
 */
export async function getCompanyNotes(code: string, name = code): Promise<CompanyNotes | null> {
  const fx = FIXTURES[code];
  if (fx) return { ...fx, source: "fixture" };
  if (hasDart() && code in CODES) return await fetchLiveNotes(code, name);
  return null;
}
