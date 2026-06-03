// 캐시 XML로 연결주석 파서를 오프라인 검증한다 (네트워크 불필요).
// 실행: node scripts/test-notes.ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseConsolidatedNotes } from "../lib/dart/notes.ts";

// 상위 파이프라인이 받아둔 캐시 XML 폴더
const CACHE = join(import.meta.dirname, "..", "..", "연결주석", "_cache");
const NAMES: Record<string, string> = {
  "352820": "하이브",
  "041510": "에스엠",
  "035900": "JYP Ent.",
  "122870": "와이지엔터테인먼트",
  "182360": "큐브엔터",
  "361570": "알비더블유",
};

const files = readdirSync(CACHE).filter((f) => f.endsWith(".xml"));
for (const f of files) {
  const stock = f.split("_")[0];
  const text = readFileSync(join(CACHE, f), "utf-8");
  const items = parseConsolidatedNotes(text);
  const cats = new Set(items.map((i) => i.category));
  const misc = items.filter((i) => i.category.startsWith("기타:")).length;
  console.log(
    `\n[${NAMES[stock] ?? stock}]  연결주석 항목 ${items.length}개 · 표준카테고리 ${cats.size}종 · 미분류 ${misc}개`
  );
  // 하이브만 상세 출력
  if (stock === "352820") {
    for (const it of items) {
      console.log(
        `  ${String(it.num).padStart(2)}. ${it.title.padEnd(28)} → [${it.category}]  ${it.chars}자·표${it.tables}`
      );
    }
  }
}
