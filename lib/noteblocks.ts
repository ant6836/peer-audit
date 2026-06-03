// 주석 본문(마크다운 표가 섞인 평문)을 '문단'과 '표' 블록으로 분해한다.
// notes.ts 가 만든 표 포맷(| a | b |, 구분선 | --- |, 셀 내 파이프는 \| 이스케이프)을 안전하게 파싱.
// 순수 함수 — UI(NoteText)에서 이 결과를 HTML로 렌더한다.

export type NoteBlock =
  | { type: "p"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

// 한 줄 → 셀 배열. 양끝 파이프 제거, 이스케이프되지 않은 '|'로 분할 후 \| 복원.
function parseCells(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));
}

const isSeparator = (cells: string[]) => cells.every((c) => /^-+$/.test(c) || c === "");

export function parseNoteBlocks(text: string): NoteBlock[] {
  const out: NoteBlock[] = [];
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const isTable = lines.length >= 2 && lines.every((l) => l.startsWith("|"));

    if (isTable) {
      const rows = lines.map(parseCells).filter((cells) => !isSeparator(cells));
      if (rows.length) {
        const [head, ...body] = rows;
        out.push({ type: "table", head, rows: body });
        continue;
      }
    }
    const t = block.trim();
    if (t) out.push({ type: "p", text: t });
  }
  return out;
}
