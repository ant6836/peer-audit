// GET /api/peers?code=352820  → 해당 기업과 같은 업종의 동종기업 목록
import { NextRequest, NextResponse } from "next/server";
import { getPeers } from "@/lib/companies";

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

  return NextResponse.json({
    base: result.base,
    industry: result.industry,
    peerCount: result.peers.length,
    peers: result.peers,
  });
}
