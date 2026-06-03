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
    setAnResults({});
    setAnBusy({});
    const res = await fetch(`/api/peers?code=${c.code}`);
    setSelected(await res.json());
    setLoading(false);
  }

  async function viewNotes(c: Company) {
    setNotesLoading(true);
    setNotes(null);
    setOpenItem(null);
    const res = await fetch(`/api/notes?code=${c.code}`);
    const data: NotesResponse = await res.json();
    setNotes({ ...data, name: data.name ?? c.name });
    setNotesLoading(false);
    setTimeout(() => document.getElementById("notes-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // 비교 분석 시작 → 계획 로드
  async function openAnalysis(baseCode: string) {
    setPlanLoading(true);
    setPlan(null);
    setAnResults({});
    setAnBusy({});
    const res = await fetch(`/api/analyze?code=${baseCode}`);
    const data: AnalysisPlan = await res.json();
    setPlan(data);
    setPlanLoading(false);
    setTimeout(() => document.getElementById("analysis-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // 카테고리 1개 분석 (이미 있거나 진행 중이면 스킵)
  async function analyzeOne(baseCode: string, category: string) {
    if (anResults[category] || anBusy[category]) return;
    setAnBusy((b) => ({ ...b, [category]: true }));
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: baseCode, category }),
      });
      const data = await res.json();
      if (data.result) setAnResults((r) => ({ ...r, [category]: data.result }));
    } finally {
      setAnBusy((b) => ({ ...b, [category]: false }));
    }
  }

  // 전체 분석 (동시 4개)
  async function analyzeAll(baseCode: string, categories: string[]) {
    setRunningAll(true);
    const todo = categories.filter((c) => !anResults[c]);
    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const cat = todo[i++];
        await analyzeOne(baseCode, cat);
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
          <span className="nav-badge">MVP-2</span>
        </div>
      </nav>

      <main className="container">
        <p className="eyebrow">Peer Benchmarking</p>
        <h1 className="title">동종기업 분석</h1>
        <p className="subtitle">
          기업을 검색해 동종기업을 찾고, 연결재무제표 주석을 항목별로 보고, 동종업계를 비교 분석합니다.
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
                    {c.notes && <span className="dot-notes" title="연결주석 제공" />}
                  </span>
                  <span className="tag">{c.market} · {c.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="hint">점(●)이 붙은 기업은 연결주석·비교 분석을 바로 볼 수 있어요.</p>

        {loading && <div className="card">불러오는 중…</div>}

        {selected && selected.base && (
          <section className="card">
            <div className="card-head">
              <h2>{selected.base.name}</h2>
              <span className="tag">{selected.base.market} · {selected.base.code}</span>
              {selected.base.notes && (
                <div className="head-actions">
                  <button className="btn-ghost-sm" onClick={() => viewNotes(selected.base)}>연결주석</button>
                  <button className="btn-ember" onClick={() => openAnalysis(selected.base.code)}>동종업계 비교 분석</button>
                </div>
              )}
            </div>
            <p className="industry">업종 · {selected.industry}</p>

            <p className="peer-count">동종기업 <strong>{selected.peerCount}</strong>곳</p>
            {selected.peers.length === 0 ? (
              <p className="empty">같은 업종으로 분류된 다른 상장사가 없습니다.</p>
            ) : (
              <table>
                <thead>
                  <tr><th>회사명</th><th>시장</th><th>종목코드</th><th></th></tr>
                </thead>
                <tbody>
                  {selected.peers.map((p) => (
                    <tr key={p.code}>
                      <td>{p.name}</td>
                      <td>{p.market}</td>
                      <td className="code">{p.code}</td>
                      <td className="action">
                        {p.notes && <button className="btn-ghost-sm" onClick={() => viewNotes(p)}>주석</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {selected && !selected.base && <div className="card empty">검색한 기업을 찾을 수 없습니다.</div>}

        {/* 비교 분석 패널 */}
        {planLoading && <div className="card">분석 준비 중…</div>}
        {plan && (
          <section className="card" id="analysis-panel">
            {!plan.available ? (
              <p className="empty">{plan.message}</p>
            ) : (
              <>
                <div className="card-head">
                  <h2>동종업계 비교 분석</h2>
                  <span className="tag">{plan.base!.name} 기준</span>
                </div>
                <p className="industry">대상 {plan.companies!.length}개사 · 주석 항목 {plan.categories!.length}개 카테고리</p>

                <div className="an-toolbar">
                  <button
                    className="btn-ember"
                    disabled={runningAll}
                    onClick={() => analyzeAll(plan.base!.code, plan.categories!)}
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
                        <button className="acc-head" onClick={() => analyzeOne(plan.base!.code, cat)}>
                          <span className="acc-title">{cat}</span>
                          <span className="acc-meta">
                            {r?._mock && <span className="cat-badge">모의</span>}
                            <span className="acc-stat">
                              {r ? "완료" : busy ? "분석 중…" : "분석하기"}
                            </span>
                          </span>
                        </button>
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
              </>
            )}
          </section>
        )}

        {notesLoading && <div className="card">주석 불러오는 중…</div>}
        {notes && (
          <section className="card" id="notes-panel">
            {!notes.available ? (
              <p className="empty">{notes.message}</p>
            ) : (
              <>
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
              </>
            )}
          </section>
        )}
      </main>
    </>
  );
}
