// 픽스처의 실제 주석 본문으로 표/문단/캡션/줄바꿈을 검증.
// 실행: node scripts/test-noteblocks.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseNoteBlocks } from "../lib/noteblocks.ts";

const fixtures = JSON.parse(
  readFileSync(join(import.meta.dirname, "..", "data", "notes-fixtures.json"), "utf-8")
);
const hybe = fixtures["352820"];
const item = hybe.items.find((it: { title: string }) => it.title.includes("개요"));
console.log(`[${item.title}] 줄바꿈 수: ${(item.text.match(/\n/g) || []).length}`);

const blocks = parseNoteBlocks(item.text);
console.log(`블록 ${blocks.length}개:`);
for (const b of blocks) {
  if (b.type === "table") {
    console.log(`  [표] caption=${JSON.stringify(b.caption)} head=${b.head.join(" | ")} (행 ${b.rows.length})`);
  } else {
    const multi = b.text.includes("\n") ? "(여러줄)" : "";
    console.log(`  [문단]${multi} ${b.text.slice(0, 50).replace(/\n/g, "⏎")}…`);
  }
}
