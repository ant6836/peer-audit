// LLM 호출 어댑터 — OpenAI 호환 Chat Completions 형식.
// 배포본은 OpenRouter(https://openrouter.ai/api/v1)를 사용한다.
// 환경변수:
//   LLM_API_KEY      — OpenRouter API 키 (sk-or-v1-...)
//   LLM_BASE_URL     — 기본 https://openrouter.ai/api/v1
//   LLM_MODEL_NAME   — 예: qwen/qwen-plus
// (선택) OpenRouter 랭킹용 헤더:
//   LLM_SITE_URL, LLM_SITE_NAME

const BASE_URL = process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1";
const MODEL = process.env.LLM_MODEL_NAME ?? "qwen/qwen3.5-flash-02-23";

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

/**
 * LLM 호출 → 텍스트 + 토큰 사용량.
 * @param messages 대화 메시지 배열
 * @param opts.temperature 기본 0.2 (분석은 일관성 위해 낮게)
 * @param opts.model 모델 오버라이드 (기본 LLM_MODEL_NAME)
 */
export async function callLLM(
  messages: LLMMessage[],
  opts: { temperature?: number; model?: string; timeoutMs?: number } = {}
): Promise<LLMResult> {
  const key = process.env.LLM_API_KEY?.trim();
  if (!key) {
    throw new Error("LLM_API_KEY가 설정되지 않았습니다 (.env.local 또는 Vercel 환경변수 확인).");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
  // OpenRouter 랭킹/식별용(선택)
  if (process.env.LLM_SITE_URL) headers["HTTP-Referer"] = process.env.LLM_SITE_URL;
  if (process.env.LLM_SITE_NAME) headers["X-Title"] = process.env.LLM_SITE_NAME;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);

  try {
    const resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: opts.model ?? MODEL,
        messages,
        temperature: opts.temperature ?? 0.2,
        stream: false,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      throw new Error(`LLM 호출 실패 (HTTP ${resp.status}): ${detail.slice(0, 500)}`);
    }

    const data = await resp.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const usage = data.usage ?? {};
    return {
      text,
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
      model: data.model ?? (opts.model ?? MODEL),
    };
  } finally {
    clearTimeout(timer);
  }
}

export const LLM_MODEL = MODEL;
