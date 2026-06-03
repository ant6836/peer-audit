// GET /api/search?q=하이브  → 회사명 검색(자동완성용)
import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/companies";

export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ query: q, results: [] });
  }
  const results = searchCompanies(q, 10);
  return NextResponse.json({ query: q, count: results.length, results });
}
