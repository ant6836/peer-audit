// 연결주석 데이터 접근 계층.
// MVP-1: 6개 쇼케이스 기업은 번들된 픽스처(파싱 완료)에서 즉시 제공.
// (임의 기업용 live DART 연동은 다음 단계에서 lib/dart/fetch.ts 로 추가 예정)
import fixtures from "@/data/notes-fixtures.json";
import availableCodes from "@/data/notes-available.json";
import type { NoteItem } from "@/lib/dart/notes";

export interface CompanyNotes {
  name: string;
  rcept: string; // 접수번호
  items: NoteItem[];
}

const FIXTURES = fixtures as unknown as Record<string, CompanyNotes>;
const AVAILABLE = new Set(availableCodes as string[]);

/** 종목코드로 연결주석 조회. 없으면 null. */
export function getNotesByCode(code: string): CompanyNotes | null {
  return FIXTURES[code] ?? null;
}

/** 해당 기업의 주석 데이터 보유 여부 (UI 배지용). */
export function hasNotes(code: string): boolean {
  return AVAILABLE.has(code);
}
