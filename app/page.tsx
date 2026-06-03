"use client";

import { useEffect, useRef, useState } from "react";

interface Company {
  code: string;
  name: string;
  market: string;
  industry: string;
}

interface PeersResponse {
  base: Company;
  industry: string;
  peerCount: number;
  peers: Company[];
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PeersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

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
    const res = await fetch(`/api/peers?code=${c.code}`);
    const data = await res.json();
    setSelected(data);
    setLoading(false);
  }

  return (
    <>
      {/* Top Navigation — 로고 좌측 상단 */}
      <nav className="nav">
        <div className="nav-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="PwC" className="logo" />
          <span className="nav-badge">MVP-0</span>
        </div>
      </nav>

      <main className="container">
        <p className="eyebrow">Peer Benchmarking</p>
        <h1 className="title">동종기업 분석</h1>
        <p className="subtitle">
          기업을 검색하면 KRX 상장사 중 같은 업종의 동종기업을 찾아줍니다.
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
                <div
                  key={c.code}
                  className="dropdown-item"
                  onClick={() => selectCompany(c)}
                >
                  <span className="company-name">{c.name}</span>
                  <span className="tag">
                    {c.market} · {c.code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="hint">입력하면 자동완성 목록이 뜹니다. 클릭하면 동종기업이 표시됩니다.</p>

        {loading && <div className="card">불러오는 중…</div>}

        {selected && selected.base && (
          <section className="card">
            <div className="card-head">
              <h2>{selected.base.name}</h2>
              <span className="tag">
                {selected.base.market} · {selected.base.code}
              </span>
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
                  </tr>
                </thead>
                <tbody>
                  {selected.peers.map((p) => (
                    <tr key={p.code}>
                      <td>{p.name}</td>
                      <td>{p.market}</td>
                      <td className="code">{p.code}</td>
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
      </main>
    </>
  );
}
