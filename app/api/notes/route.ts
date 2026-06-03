// GET /api/notes?code=352820  → 해당 기업의 연결재무제표 주석(항목별)
import { NextRequest, NextResponse } from "next/server";
import { getNotesByCode } from "@/lib/dart/store";

export function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ error: "code 파라미터가 필요합니다." }, { status: 400 });
  }

  const notes = getNotesByCode(code);
  if (!notes) {
    // 픽스처에 없는 기업 — live DART 연동(다음 단계)에서 처리 예정
    return NextResponse.json({
      available: false,
      code,
      message:
        "이 기업의 연결주석 데이터는 아직 준비되지 않았습니다. (현재 6개 쇼케이스 기업만 제공 · live DART 연동 예정)",
    });
  }

  return NextResponse.json({
    available: true,
    code,
    name: notes.name,
    rcept: notes.rcept,
    count: notes.items.length,
    items: notes.items,
  });
}
