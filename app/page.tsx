"use client";

import { useEffect, useRef, useState } from "react";

interface Company {
  code: string;
  name: string;
  market: string;
  industry: string;
  notes?: boolean; // 연결주석 데이터 보유 여부
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PeersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // 주석 뷰어 상태
  const [notes, setNotes] = useState<NotesResponse | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [openItem, setOpenItem] = useState<number | null>(null);

  // 검색어 입력 → 디바운스(250ms) 후 자동완성 조회
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

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // 기업 선택 → 동종기업 조회
  async function selectCompany(c: Company) {
    setQuery(c.name);
    setOpen(false);
    setLoading(true);
    setSelected(null);
    setNotes(null);
    const res = await fetch(`/api/peers?code=${c.code}`);
    const data = await res.json();
    setSelected(data);
    setLoading(false);
  }

  // 연결주석 보기
  async function viewNotes(c: Company) {
    setNotesLoading(true);
    setNotes(null);
    setOpenItem(null);
    const res = await fetch(`/api/notes?code=${c.code}`);
    const data: NotesResponse = await res.json();
    setNotes({ ...data, name: data.name ?? c.name });
    setNotesLoading(false);
    // 주석 패널로 부드럽게 스크롤
    setTimeout(() => document.getElementById("notes-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  return (
    <>
      {/* Top Navigation — 로고 좌측 상단 */}
      <nav className="nav">
        <div className="nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PwC" className="logo" />
          <span className="nav-badge">MVP-1</span>
        </div>
      </nav>

      <main className="container">
        <p className="eyebrow">Peer Benchmarking</p>
        <h1 className="title">동종기업 분석</h1>
        <p className="subtitle">
          기업을 검색해 같은 업종의 동종기업을 찾고, 각 사의 연결재무제표 주석을 항목별로 살펴봅니다.
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
                  <span className="tag">
                    {c.market} · {c.code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="hint">입력하면 자동완성 목록이 뜹니다. 점(●)이 붙은 기업은 연결주석을 바로 볼 수 있어요.</p>

        {loading && <div className="card">불러오는 중…</div>}

        {selected && selected.base && (
          <section className="card">
            <div className="card-head">
              <h2>{selected.base.name}</h2>
              <span className="tag">
                {selected.base.market} · {selected.base.code}
              </span>
              {selected.base.notes && (
                <button className="btn-ember" onClick={() => viewNotes(selected.base)}>
                  연결주석 보기
                </button>
              )}
            </div>
            <p className="industry">업종 · {selected.industry}</p>

            <p className="peer-count">
              동종기업 <strong>{selected.peerCount}</strong>곳
            </p>
            {selected.peers.length === 0 ? (
              <p className="empty">같은 업종으로 분류된 다른 상장사가 없습니다.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>회사명</th>
                    <th>시장</th>
                    <th>종목코드</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selected.peers.map((p) => (
                    <tr key={p.code}>
                      <td>{p.name}</td>
                      <td>{p.market}</td>
                      <td className="code">{p.code}</td>
                      <td className="action">
                        {p.notes && (
                          <button className="btn-ghost-sm" onClick={() => viewNotes(p)}>
                            주석
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {selected && !selected.base && (
          <div className="card empty">검색한 기업을 찾을 수 없습니다.</div>
        )}

        {notesLoading && <div className="card">주석 불러오는 중…</div>}

        {/* 연결주석 뷰어 */}
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
                <p className="industry">
                  주석 {notes.count}개 항목 · 접수번호 {notes.rcept}
                </p>

                <div className="accordion">
                  {notes.items!.map((it) => (
                    <div className="acc-item" key={it.num}>
                      <button
                        className="acc-head"
                        onClick={() => setOpenItem(openItem === it.num ? null : it.num)}
                      >
                        <span className="acc-title">
                          <span className="acc-num">{it.num}</span>
                          {it.title}
                        </span>
                        <span className="acc-meta">
                          <span className="cat-badge">{it.category}</span>
                          <span className="acc-stat">
                            {it.chars.toLocaleString()}자 · 표 {it.tables}
                          </span>
                          <span className="chev">{openItem === it.num ? "−" : "+"}</span>
                        </span>
                      </button>
                      {openItem === it.num && <pre className="acc-body">{it.text}</pre>}
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
