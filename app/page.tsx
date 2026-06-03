"use client";

import { useEffect, useRef, useState } from "react";
import { parseNoteBlocks } from "@/lib/noteblocks";

// 주석 본문을 문단/표로 렌더 (마크다운 표 → 실제 HTML 표)
function NoteText({ text }: { text: string }) {
  const blocks = parseNoteBlocks(text);
  return (
    <>
      {blocks.map((b, i) =>
        b.type === "table" ? (
          <div className="note-table-wrap" key={i}>
            <table className="note-table">
              <thead>
                <tr>{b.head.map((c, j) => <th key={j}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>{r.map((c, ci) => <td key={ci}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="note-p" key={i}>{b.text}</p>
        )
      )}
    </>
  );
}

interface Company {
  code: string;
  name: string;
  market: string;
  industry: string;
  notes?: boolean;
}

interface PeersResponse {
  base: Company;
  industry: string;
  peerCount: number;
  peers: Company[];
}

interface NoteItem {
  num: number;
  title: string;
  category: string;
  chars: number;
  tables: number;
  text: string;
}

interface NotesResponse {
  available: boolean;
  code: string;
  name?: string;
  rcept?: string;
  count?: number;
  items?: NoteItem[];
  message?: string;
}

interface AnalysisPlan {
  available: boolean;
  base?: { code: string; name: string };
  companies?: { code: string; name: string }[];
  categories?: string[];
  message?: string;
}

interface AnalysisResult {
  회사별_회계처리: Record<string, string>;
  공통점: string;
  기준기업_특이점: string;
  감사_주목포인트: string;
  _mock?: boolean;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PeersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 우측 메인 탭
  const [tab, setTab] = useState<"analysis" | "notes">("analysis");

  // 주석 뷰어
  const [notes, setNotes] = useState<NotesResponse | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);

  // 비교 분석
  const [plan, setPlan] = useState<AnalysisPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [anResults, setAnResults] = useState<Record<string, AnalysisResult>>({});
  const [anBusy, setAnBusy] = useState<Record<string, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [planError, setPlanError] = useState<string | null>(null);
  const [anErr, setAnErr] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function selectCompany(c: Company) {
    setQuery(c.name);
    setOpen(false);
    setLoading(true);
    setSelected(null);
    setNotes(null);
    setPlan(null);
    setPlanError(null);
    setAnResults({});
    setAnBusy({});
    setAnErr({});
    setSel([]);
    setTab("analysis");
    const res = await fetch(`/api/peers?code=${c.code}`);
    const data: PeersResponse = await res.json();
    setSelected(data);
    setSel((data.peers ?? []).filter((p) => p.notes).slice(0, 7).map((p) => p.code));
    setLoading(false);
  }

  function togglePeer(code: string) {
    setSel((s) => (s.includes(code) ? s.filter((x) => x !== code) : [...s, code]));
  }

  async function viewNotes(c: Company) {
    setTab("notes");
    setNotesLoading(true);
    setNotes(null);
    setOpenItem(null);
    const res = await fetch(`/api/notes?code=${c.code}`);
    const data: NotesResponse = await res.json();
    setNotes({ ...data, name: data.name ?? c.name });
    setNotesLoading(false);
  }

  async function openAnalysis() {
    if (!selected?.base) return;
    setTab("analysis");
    const baseCode = selected.base.code;
    const codes = [baseCode, ...sel];
    setPlanLoading(true);
    setPlan(null);
    setPlanError(null);
    setAnResults({});
    setAnBusy({});
    setAnErr({});
    try {
      const res = await fetch(`/api/analyze?code=${baseCode}&codes=${codes.join(",")}`);
      if (!res.ok) throw new Error(`서버 응답 오류 (${res.status}) — 보고서가 크면 시간 초과일 수 있어요. 기업 수를 줄여보세요.`);
      const data: AnalysisPlan = await res.json();
      setPlan(data);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "분석 준비에 실패했습니다.");
    } finally {
      setPlanLoading(false);
    }
  }

  async function analyzeOne(baseCode: string, category: string, codes: string[]) {
    if (anResults[category] || anBusy[category]) return;
    setAnBusy((b) => ({ ...b, [category]: true }));
    setAnErr((e) => ({ ...e, [category]: "" }));
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: baseCode, category, codes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.result) throw new Error(data.error ?? `서버 오류 (${res.status})`);
      setAnResults((r) => ({ ...r, [category]: data.result }));
    } catch (e) {
      setAnErr((er) => ({ ...er, [category]: e instanceof Error ? e.message : "분석 실패" }));
    } finally {
      setAnBusy((b) => ({ ...b, [category]: false }));
    }
  }

  async function analyzeAll(baseCode: string, categories: string[], codes: string[]) {
    setRunningAll(true);
    const todo = categories.filter((c) => !anResults[c]);
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const cat = todo[i++];
        await analyzeOne(baseCode, cat, codes);
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    setRunningAll(false);
  }

  const doneCount = plan?.categories ? plan.categories.filter((c) => anResults[c]).length : 0;

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PwC" className="logo" />
          <span className="nav-badge">동종기업 분석</span>
        </div>
      </nav>

      <main className="container">
        <header className="page-head">
          <p className="eyebrow">Peer Benchmarking</p>
          <h1 className="title">동종기업 분석</h1>
          <p className="subtitle">
            기업을 검색해 동종기업을 찾고, 연결재무제표 주석을 보고, 동종업계를 비교 분석합니다.
          </p>

          <div className="search-box" ref={boxRef}>
            <input
              className="search-input"
              placeholder="기업명을 입력하세요 (예: 하이브, 삼성전자)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
            />
            {open && results.length > 0 && (
              <div className="dropdown">
                {results.map((c) => (
                  <div key={c.code} className="dropdown-item" onClick={() => selectCompany(c)}>
                    <span className="company-name">
                      {c.name}
                      {c.notes && <span className="dot-notes" title="주석 조회 가능" />}
                    </span>
                    <span className="tag">{c.market} · {c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {loading && <div className="card">불러오는 중…</div>}

        {selected && selected.base && (
          <div className="layout">
            {/* ── 좌측 사이드바 ── */}
            <aside className="sidebar">
              <div className="sidebar-card">
                <h2 className="sb-name">{selected.base.name}</h2>
                <span className="tag">{selected.base.market} · {selected.base.code}</span>
                <p className="industry">업종 · {selected.industry}</p>

                <div className="sb-label">동종기업 {selected.peerCount}곳 · 비교 선택</div>
                <div className="peer-list">
                  {selected.peers.map((p) => (
                    <div className="peer-row" key={p.code}>
                      {p.notes ? (
                        <input
                          type="checkbox"
                          checked={sel.includes(p.code)}
                          onChange={() => togglePeer(p.code)}
                        />
                      ) : (
                        <span className="chk-na" title="주석 데이터 없음">–</span>
                      )}
                      <span className="peer-name">{p.name}</span>
                      {p.notes && (
                        <button className="btn-link" onClick={() => viewNotes(p)}>주석</button>
                      )}
                    </div>
                  ))}
                </div>

                <button className="btn-ember sb-btn" onClick={openAnalysis} disabled={sel.length === 0}>
                  비교 분석 ({sel.length + 1}개사)
                </button>
                {selected.base.notes && (
                  <button className="btn-ghost-sm sb-btn" onClick={() => viewNotes(selected.base)}>
                    기준기업 연결주석
                  </button>
                )}
                {sel.length + 1 > 8 && (
                  <p className="hint">8개사 이하를 권장합니다(비용·표 가독성).</p>
                )}
              </div>
            </aside>

            {/* ── 우측 메인 ── */}
            <section className="main">
              <div className="tabs">
                <button className={tab === "analysis" ? "tab active" : "tab"} onClick={() => setTab("analysis")}>
                  비교 분석
                </button>
                <button className={tab === "notes" ? "tab active" : "tab"} onClick={() => setTab("notes")}>
                  연결주석
                </button>
              </div>

              {/* 비교 분석 탭 */}
              {tab === "analysis" && (
                <div>
                  {planLoading && (
                    <div className="card">분석 준비 중… (처음 조회하는 기업은 사업보고서 다운로드로 수십 초 걸릴 수 있어요)</div>
                  )}
                  {planError && <div className="card empty">⚠ {planError}</div>}
                  {!planLoading && !planError && !plan && (
                    <div className="card empty">왼쪽에서 비교할 기업을 고른 뒤 <b>비교 분석</b>을 누르세요.</div>
                  )}
                  {plan && !plan.available && <div className="card empty">{plan.message}</div>}
                  {plan && plan.available && (
                    <div className="card">
                      <div className="card-head">
                        <h2>동종업계 비교 분석</h2>
                        <span className="tag">{plan.base!.name} 기준</span>
                      </div>
                      <p className="industry">대상 {plan.companies!.length}개사 · 주석 항목 {plan.categories!.length}개 카테고리</p>

                      <div className="an-toolbar">
                        <button
                          className="btn-ember"
                          disabled={runningAll}
                          onClick={() => analyzeAll(plan.base!.code, plan.categories!, plan.companies!.map((c) => c.code))}
                        >
                          {runningAll ? `분석 중… ${doneCount}/${plan.categories!.length}` : "전체 분석"}
                        </button>
                        <span className="an-progress">{doneCount}/{plan.categories!.length} 완료</span>
                      </div>

                      <div className="accordion">
                        {plan.categories!.map((cat) => {
                          const r = anResults[cat];
                          const busy = anBusy[cat];
                          return (
                            <div className="acc-item" key={cat}>
                              <button className="acc-head" onClick={() => analyzeOne(plan.base!.code, cat, plan.companies!.map((c) => c.code))}>
                                <span className="acc-title">{cat}</span>
                                <span className="acc-meta">
                                  {r?._mock && <span className="cat-badge">모의</span>}
                                  <span className="acc-stat">
                                    {r ? "완료" : busy ? "분석 중…" : anErr[cat] ? "실패·재시도" : "분석하기"}
                                  </span>
                                </span>
                              </button>
                              {anErr[cat] && !r && <p className="an-err">⚠ {anErr[cat]}</p>}
                              {r && (
                                <div className="an-body">
                                  <table className="an-table">
                                    <thead><tr><th>회사</th><th>회계처리·정책</th></tr></thead>
                                    <tbody>
                                      {plan.companies!.map((c) => (
                                        <tr key={c.code}>
                                          <td className={c.code === plan.base!.code ? "an-base" : ""}>{c.name}</td>
                                          <td>{r.회사별_회계처리?.[c.name] ?? "—"}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  {r.공통점 && <p className="an-line"><b>공통점</b> {r.공통점}</p>}
                                  {r.기준기업_특이점 && <p className="an-line"><b>{plan.base!.name} 특이점</b> {r.기준기업_특이점}</p>}
                                  {r.감사_주목포인트 && <p className="an-line audit"><b>감사 주목포인트</b> {r.감사_주목포인트}</p>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 연결주석 탭 */}
              {tab === "notes" && (
                <div>
                  {notesLoading && <div className="card">주석 불러오는 중…</div>}
                  {!notesLoading && !notes && (
                    <div className="card empty">왼쪽 기업의 <b>주석</b> 버튼을 눌러 연결주석을 확인하세요.</div>
                  )}
                  {notes && !notes.available && <div className="card empty">{notes.message}</div>}
                  {notes && notes.available && (
                    <div className="card">
                      <div className="card-head">
                        <h2>{notes.name}</h2>
                        <span className="tag">연결재무제표 주석</span>
                      </div>
                      <p className="industry">주석 {notes.count}개 항목 · 접수번호 {notes.rcept}</p>
                      <div className="accordion">
                        {notes.items!.map((it) => (
                          <div className="acc-item" key={it.num}>
                            <button className="acc-head" onClick={() => setOpenItem(openItem === it.num ? null : it.num)}>
                              <span className="acc-title">
                                <span className="acc-num">{it.num}</span>
                                {it.title}
                              </span>
                              <span className="acc-meta">
                                <span className="cat-badge">{it.category}</span>
                                <span className="acc-stat">{it.chars.toLocaleString()}자 · 표 {it.tables}</span>
                                <span className="chev">{openItem === it.num ? "−" : "+"}</span>
                              </span>
                            </button>
                            {openItem === it.num && (
                              <div className="acc-body"><NoteText text={it.text} /></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {selected && !selected.base && <div className="card empty">검색한 기업을 찾을 수 없습니다.</div>}
      </main>
    </>
  );
}
