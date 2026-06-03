// GET /api/notes?code=352820  → 해당 기업의 연결재무제표 주석(항목별)
// 픽스처(6개 쇼케이스) 우선, 없으면 DART 라이브(상장사, DART_API_KEY 필요).
import { NextRequest, NextResponse } from "next/server";
import { getCompanyNotes } from "@/lib/dart/store";
import { getCompanyByCode } from "@/lib/companies";

export const maxDuration = 60; // 라이브 DART 조회·파싱 여유

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ error: "code 파라미터가 필요합니다." }, { status: 400 });
  }

  const name = getCompanyByCode(code)?.name ?? code;
  const notes = await getCompanyNotes(code, name);
  if (!notes || notes.items.length === 0) {
    return NextResponse.json({
      available: false,
      code,
      message:
        "이 기업의 연결재무제표 주석을 가져오지 못했습니다. (상장사가 아니거나, 최신 사업보고서/연결주석이 없거나, DART 조회 실패)",
    });
  }

  return NextResponse.json({
    available: true,
    code,
    name: notes.name,
    rcept: notes.rcept,
    source: notes.source,
    count: notes.items.length,
    items: notes.items,
  });
}
