// 동종업계 연결주석 항목별 비교 분석 (04_build_audit_report.py 의 웹 버전).
// 카테고리 1개 = LLM 1회. 클라이언트가 카테고리별로 호출해 점진 렌더한다.
import { getPeers } from "@/lib/companies";
import { getNotesByCode, hasNotes } from "@/lib/dart/store";
import { CATEGORY_ORDER } from "@/lib/dart/notes";
import { callLLM } from "@/lib/llm";

const MAXCHARS = 3500; // 회사·카테고리당 LLM 입력 트렁케이트

export interface AnalysisResult {
  회사별_회계처리: Record<string, string>;
  공통점: string;
  기준기업_특이점: string;
  감사_주목포인트: string;
  _tokens?: [number, number];
  _mock?: boolean;
  _raw?: string;
}

export interface AnalysisPlan {
  base: { code: string; name: string };
  companies: { code: string; name: string }[]; // 주석 보유 기업(기준 포함)
  categories: string[]; // 분석 대상 카테고리(회계 흐름 순)
}

/**
 * 기준기업 + 동종기업 중 주석 보유 기업과, 그 합집합 카테고리를 산출.
 * @param selectedCodes 비교 대상으로 선택된 종목코드(있으면 그 집합으로 한정, 기준기업은 항상 포함)
 */
export function getAnalysisPlan(baseCode: string, selectedCodes?: string[]): AnalysisPlan | null {
  const peers = getPeers(baseCode);
  if (!peers) return null;

  let all = [peers.base, ...peers.peers].filter((c) => hasNotes(c.code));
  if (selectedCodes && selectedCodes.length) {
    const set = new Set(selectedCodes);
    set.add(peers.base.code); // 기준기업은 항상 포함
    all = all.filter((c) => set.has(c.code));
  }
  const companies = all.map((c) => ({ code: c.code, name: c.name }));

  const catSet = new Set<string>();
  for (const c of companies) {
    const notes = getNotesByCode(c.code);
    notes?.items.forEach((it) => catSet.add(it.category));
  }
  // 회계 흐름 순 정렬(룰에 없는 '기타:'는 뒤로)
  const categories = [...catSet].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib) || a.localeCompare(b, "ko");
  });

  return { base: { code: peers.base.code, name: peers.base.name }, companies, categories };
}

/** 한 회사의 특정 카테고리 주석 본문을 합쳐 트렁케이트. 없으면 "". */
function categoryText(code: string, category: string): string {
  const notes = getNotesByCode(code);
  if (!notes) return "";
  const parts = notes.items
    .filter((it) => it.category === category)
    .map((it) => `[${it.title}] ${it.text}`);
  return parts.join("\n").slice(0, MAXCHARS);
}

function buildMessages(plan: AnalysisPlan, category: string) {
  const baseName = plan.base.name;
  const peerNames = plan.companies.filter((c) => c.code !== plan.base.code).map((c) => c.name);

  const body = plan.companies
    .map((c) => {
      const t = categoryText(c.code, category);
      return `=== ${c.name} ===\n${t || "해당 주석 없음"}`;
    })
    .join("\n\n");

  const fields = plan.companies.map((c) => `"${c.name}": "회계정책/처리 핵심 1~2문장"`).join(", ");

  const instruct = `당신은 회계법인의 감사 매니저입니다. '${baseName}'의 외부감사를 처음 수임했고,
신규 클라이언트 이해를 위해 동종업계(${peerNames.join(", ")})의 최신 사업보고서
'연결재무제표 주석'을 항목별로 벤치마킹합니다.

[비교 대상 주석 항목] ${category}

아래는 각 회사의 해당 주석 원문 발췌입니다(표는 마크다운).

${body}

위 자료만 근거로(추측·창작 금지) 아래 JSON 형식으로만 답하세요. 설명·머리말 없이 JSON만 출력:
{
  "회사별_회계처리": { ${fields} },
  "공통점": "동종업계가 공유하는 회계처리·정책(1~2문장)",
  "기준기업_특이점": "${baseName}이(가) 동종업계 대비 다른 점. 없으면 '특이사항 없음'",
  "감사_주목포인트": "신규 감사인이 확인하거나 위험(추정·판단 개입, 공시 충실성 등)으로 볼 사항(1~3가지)"
}
해당 주석이 없는 회사는 "해당 없음"으로 표기. 한국어로 작성.`;

  return [{ role: "user" as const, content: instruct }];
}

function parseJson(text: string, plan: AnalysisPlan): AnalysisResult {
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]) as AnalysisResult;
    } catch {
      /* fall through */
    }
  }
  return {
    회사별_회계처리: {},
    공통점: "",
    기준기업_특이점: "",
    감사_주목포인트: "(응답 파싱 실패)",
    _raw: text.slice(0, 500),
  };
}

function mockResult(plan: AnalysisPlan, category: string): AnalysisResult {
  const byco: Record<string, string> = {};
  for (const c of plan.companies) {
    byco[c.name] = categoryText(c.code, category)
      ? `(모의) ${c.name}의 '${category}' 회계처리 요약입니다.`
      : "해당 없음";
  }
  return {
    회사별_회계처리: byco,
    공통점: `(모의) 동종업계는 '${category}'에서 유사한 K-IFRS 정책을 따릅니다.`,
    기준기업_특이점: `(모의) ${plan.base.name}의 특이점 없음.`,
    감사_주목포인트: `(모의) '${category}' 관련 추정·공시 충실성 확인 권장.`,
    _mock: true,
  };
}

// 인스턴스 메모리 캐시(같은 입력 재호출 비용 절감). 영속 캐시는 추후.
const cache = new Map<string, AnalysisResult>();

/** 카테고리 1개 비교 분석. LLM_MOCK=1 이면 모의 응답. */
export async function analyzeCategory(
  baseCode: string,
  category: string,
  selectedCodes?: string[]
): Promise<{ category: string; result: AnalysisResult } | null> {
  const plan = getAnalysisPlan(baseCode, selectedCodes);
  if (!plan) return null;
  if (!plan.categories.includes(category)) return null;

  // 캐시 키는 실제 비교 기업 집합 + 카테고리 (선택이 바뀌면 결과도 다름)
  const setKey = plan.companies.map((c) => c.code).sort().join(",");
  const key = `${setKey}::${category}`;
  const cached = cache.get(key);
  if (cached) return { category, result: cached };

  if (process.env.LLM_MOCK === "1") {
    const result = mockResult(plan, category);
    cache.set(key, result);
    return { category, result };
  }

  const messages = buildMessages(plan, category);
  const { text, inputTokens, outputTokens } = await callLLM(messages, { temperature: 0.2 });
  const result = parseJson(text, plan);
  result._tokens = [inputTokens, outputTokens];
  cache.set(key, result);
  return { category, result };
}
