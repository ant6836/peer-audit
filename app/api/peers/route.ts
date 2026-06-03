// GET /api/peers?code=352820  → 해당 기업과 같은 업종의 동종기업 목록
import { NextRequest, NextResponse } from "next/server";
import { getPeers } from "@/lib/companies";
import { hasNotes } from "@/lib/dart/store";

export function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ error: "code 파라미터가 필요합니다." }, { status: 400 });
  }

  const result = getPeers(code);
  if (!result) {
    return NextResponse.json(
      { error: `종목코드 '${code}' 를 목록에서 찾지 못했습니다.` },
      { status: 404 }
    );
  }

  // 주석 데이터 보유 여부를 함께 실어 UI 배지에 활용
  return NextResponse.json({
    base: { ...result.base, notes: hasNotes(result.base.code) },
    industry: result.industry,
    peerCount: result.peers.length,
    peers: result.peers.map((p) => ({ ...p, notes: hasNotes(p.code) })),
  });
}
