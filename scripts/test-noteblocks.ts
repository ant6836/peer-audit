// 픽스처의 실제 주석 본문으로 표/문단 분해를 검증.
// 실행: node scripts/test-noteblocks.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNoteBlocks } from "../lib/noteblocks.ts";

const fixtures = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "data", "notes-fixtures.json"), "utf-8")
);
const hybe = fixtures["352820"];
// 표가 많은 항목 하나 고르기
const item = hybe.items.find((it: { tables: number }) => it.tables > 0);
const blocks = parseNoteBlocks(item.text);
const tables = blocks.filter((b) => b.type === "table");
const paras = blocks.filter((b) => b.type === "p");
console.log(`[${item.title}] 표${item.tables}개 표기 / 파싱: 블록 ${blocks.length}개 (표 ${tables.length}, 문단 ${paras.length})`);

const t = tables[0] as { type: "table"; head: string[]; rows: string[][] };
if (t) {
  console.log("\n첫 표 헤더:", t.head.join(" | "));
  console.log("행 수:", t.rows.length, "/ 첫 행:", t.rows[0]?.join(" | "));
  console.log("열 수 일관성:", t.rows.every((r) => r.length === t.head.length) ? "OK" : "불일치");
}
