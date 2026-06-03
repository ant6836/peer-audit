// 분석 API를 UTF-8로 정확히 검증 (bash curl 한글 인코딩 이슈 회피).
// 사전: npm run start 로 서버 기동. 실행: node scripts/test-analyze.ts
const BASE = "http://localhost:3000";

const plan = await (await fetch(`${BASE}/api/analyze?code=352820`)).json();
console.log("[계획] available:", plan.available, "| 기업:", plan.companies?.length, "| 카테고리:", plan.categories?.length);
console.log("  특수관계자 포함?", plan.categories?.includes("특수관계자"));

const cat = plan.categories[0];
console.log(`\n[POST] category="${cat}" 분석 요청…`);
const res = await fetch(`${BASE}/api/analyze`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "352820", category: cat }),
});
const out = await res.json();
if (out.result) {
  const r = out.result;
  console.log("  category:", out.category, "| _mock:", r._mock);
  console.log("  회사별 키:", Object.keys(r.회사별_회계처리 || {}).join(", "));
  console.log("  공통점:", r.공통점);
  console.log("  감사_주목포인트:", r.감사_주목포인트);
} else {
  console.log("  실패 응답:", JSON.stringify(out));
}
