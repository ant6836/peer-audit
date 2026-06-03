// GET  /api/analyze?code=352820        → 분석 계획(기준기업·대상기업·카테고리 목록), LLM 미호출
// POST /api/analyze  {code, category}  → 해당 카테고리 1개 비교 분석(LLM 1회)
import { NextRequest, NextResponse } from "next/server";
import { getAnalysisPlan, analyzeCategory } from "@/lib/analyze";

export const maxDuration = 60; // 라이브 DART 조회·파싱 여유

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  if (!code) {
    return NextResponse.json({ error: "code 파라미터가 필요합니다." }, { status: 400 });
  }
  const codesParam = req.nextUrl.searchParams.get("codes")?.trim();
  const codes = codesParam ? codesParam.split(",").filter(Boolean) : undefined;
  const plan = await getAnalysisPlan(code, codes);
  if (!plan || plan.companies.length < 2) {
    return NextResponse.json({
      available: false,
      message: "비교 분석은 주석 데이터가 있는 기업이 2곳 이상일 때 가능합니다. (현재 6개 쇼케이스 기업)",
    });
  }
  return NextResponse.json({ available: true, ...plan });
}

export async function POST(req: NextRequest) {
  let body: { code?: string; category?: string; codes?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
  }
  const code = body.code?.trim();
  const category = body.category?.trim();
  const codes = Array.isArray(body.codes) ? body.codes : undefined;
  if (!code || !category) {
    return NextResponse.json({ error: "code 와 category 가 필요합니다." }, { status: 400 });
  }

  try {
    const out = await analyzeCategory(code, category, codes);
    if (!out) {
      return NextResponse.json({ error: "분석 대상이 아닙니다." }, { status: 404 });
    }
    return NextResponse.json(out);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `분석 실패: ${msg}` }, { status: 502 });
  }
}
