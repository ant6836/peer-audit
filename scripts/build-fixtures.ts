// 캐시 XML 6개사를 파싱해 번들용 주석 픽스처(data/notes-fixtures.json)를 생성한다.
// 로컬·Vercel 모두에서 쇼케이스 6개사 주석을 네트워크 없이 즉시 제공하기 위함.
// 실행: node scripts/build-fixtures.ts
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseConsolidatedNotes } from "../lib/dart/notes.ts";

const CACHE = join(import.meta.dirname, "..", "..", "연결주석", "_cache");
const OUT = join(import.meta.dirname, "..", "data", "notes-fixtures.json");

const NAMES: Record<string, string> = {
  "352820": "하이브",
  "041510": "에스엠",
  "035900": "JYP Ent.",
  "122870": "와이지엔터테인먼트",
  "182360": "큐브엔터",
  "361570": "알비더블유",
};

const fixtures: Record<string, { name: string; rcept: string; items: unknown[] }> = {};
for (const f of readdirSync(CACHE).filter((x) => x.endsWith(".xml"))) {
  const [stock, rest] = f.replace(".xml", "").split("_");
  const text = readFileSync(join(CACHE, f), "utf-8");
  const items = parseConsolidatedNotes(text);
  fixtures[stock] = { name: NAMES[stock] ?? stock, rcept: rest, items };
  console.log(`${NAMES[stock] ?? stock} (${stock}): ${items.length}개 항목`);
}

mkdirSync(join(import.meta.dirname, "..", "data"), { recursive: true });
writeFileSync(OUT, JSON.stringify(fixtures), "utf-8");
const kb = (Buffer.byteLength(JSON.stringify(fixtures)) / 1024).toFixed(0);
console.log(`\n저장 → data/notes-fixtures.json (${kb} KB)`);

// 어떤 기업이 주석을 가졌는지 표시하기 위한 가벼운 코드 목록(검색/동종기업 응답용)
const AVAIL = join(import.meta.dirname, "..", "data", "notes-available.json");
writeFileSync(AVAIL, JSON.stringify(Object.keys(fixtures)), "utf-8");
console.log("저장 → data/notes-available.json", Object.keys(fixtures));
