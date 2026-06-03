// 주석 본문(마크다운 표가 섞인 평문)을 '문단'과 '표' 블록으로 분해한다.
// notes.ts 가 만든 표 포맷(| a | b |, 구분선 | --- |, 셀 내 파이프는 \| 이스케이프)을 안전하게 파싱.
// 순수 함수 — UI(NoteText)에서 이 결과를 HTML로 렌더한다.

export type NoteBlock =
  | { type: "p"; text: string }
  | { type: "table"; head: string[]; rows: string[][]; caption?: string };

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
      let rows = lines.map(parseCells).filter((cells) => !isSeparator(cells));
      if (rows.length) {
        // 열 수 정규화(패딩)
        let width = Math.max(...rows.map((r) => r.length));
        rows = rows.map((r) => {
          const c = [...r];
          while (c.length < width) c.push("");
          return c;
        });
        // 모든 행이 비어 있는 꼬리 열 제거(DART 표 끝의 빈 칸)
        while (width > 1 && rows.every((r) => r[width - 1] === "")) {
          rows.forEach((r) => r.pop());
          width--;
        }
        // 사실상 1열이면 표가 아니라 텍스트로 취급
        if (width <= 1) {
          const t = rows.map((r) => r[0]).filter(Boolean).join(" ").trim();
          if (t) out.push({ type: "p", text: t });
          continue;
        }
        // 상단의 희소한 행(예: '<당기말>  (단위: 천원)')은 데이터 헤더가 아니라
        // 캡션 → 표 위로 분리. (비어있지 않은 셀 ≤2 & 빈 셀 ≥2)
        const captionParts: string[] = [];
        while (rows.length > 2) {
          const ne = rows[0].filter((c) => c !== "").length;
          if (ne >= 1 && ne <= 2 && width - ne >= 2) {
            captionParts.push(rows[0].filter(Boolean).join("  "));
            rows.shift();
          } else break;
        }
        const [head, ...body] = rows;
        out.push({
          type: "table",
          head,
          rows: body,
          caption: captionParts.length ? captionParts.join(" · ") : undefined,
        });
        continue;
      }
    }
    const t = block.trim();
    if (t) out.push({ type: "p", text: t });
  }
  return out;
}
