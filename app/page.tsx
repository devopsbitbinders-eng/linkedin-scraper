"use client";
import { useMemo, useState } from "react";

type Row = Record<string, unknown>;

function toCSV(rows: Row[]): string {
  if (!rows?.length) return "";

  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r || {}))));

  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = cols.map(escape).join(",");
  const lines = rows.map((r) => cols.map((c) => escape(r?.[c])).join(","));
  return [header, ...lines].join("\n");
}

function downloadText(filename: string, text: string): void {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [maxPosts, setMaxPosts] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<{ keyword?: string; count?: number; posts?: Row[] } | null>(null);
const posts: Row[] = data?.posts || [];

  const csv = useMemo(() => toCSV(posts), [posts]);

  async function runScrape() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const r = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, maxPosts: Number(maxPosts) || 10 }),
      });

      const res = await r.json().catch(() => ({}));

      if (!r.ok) {
        setError(res?.error || "Failed");
      } else {
        const normalized = Array.isArray(res) ? res[0] : res;
        setData(normalized);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const colsToShow = [
    "keyword",
    "authorName",
    "authorProfileUrl",
    "text",
    "postUrl",
    "likes",
    "comments",
    "postDate",
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px", letterSpacing: "-0.025em" }}>
          LinkedIn Scraper
        </h1>
        <p style={{ color: "#64748b", fontSize: "1.125rem", maxWidth: "800px", lineHeight: 1.6 }}>
          Enter one or multiple keywords separated by commas to scrape LinkedIn posts.
        </p>
      </header>

      <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)", marginBottom: "32px" }}>
        <div style={{ display: "grid", gap: "24px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
              Keywords
            </label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., marketing, technology, AI, recruitment"
              style={{ 
                width: "100%", 
                padding: "16px", 
                borderRadius: "12px", 
                border: "1px solid #e2e8f0",
                fontSize: "1rem",
                transition: "all 0.2s",
                outline: "none"
              }}
              onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
              onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>

          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0 }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                Max Posts
              </label>
              <input
                type="number"
                value={maxPosts}
                onChange={(e) => setMaxPosts(e.target.value === "" ? 0 : Number(e.target.value))}
                min={1}
                max={100}
                style={{ 
                  padding: "16px", 
                  borderRadius: "12px", 
                  border: "1px solid #e2e8f0",
                  width: "140px",
                  fontSize: "1rem"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={runScrape}
                disabled={!keyword.trim() || loading}
                style={{ 
                  padding: "16px 28px", 
                  borderRadius: "12px", 
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: (!keyword.trim() || loading) ? 0.6 : 1,
                  minWidth: "140px"
                }}
               onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
  if (keyword.trim() && !loading) e.currentTarget.style.backgroundColor = "#2563eb";
}}
onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
  if (keyword.trim() && !loading) e.currentTarget.style.backgroundColor = "#3b82f6";
}}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                    Scraping...
                  </span>
                ) : "Scrape Posts"}
              </button>

              <button
                onClick={() => downloadText(`linkedin-posts-${Date.now()}.csv`, csv)}
                disabled={!posts.length}
                style={{
                  padding: "16px 28px",
                  borderRadius: "12px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  cursor: posts.length ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                  opacity: posts.length ? 1 : 0.6,
                  minWidth: "140px"
                }}
                onMouseEnter={(e) => {
                  if (posts.length) e.target.style.backgroundColor = "#059669";
                }}
                onMouseLeave={(e) => {
                  if (posts.length) e.target.style.backgroundColor = "#10b981";
                }}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: "#fee2e2", 
          border: "1px solid #fecaca", 
          color: "#dc2626", 
          padding: "16px", 
          borderRadius: "12px", 
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span style={{ fontSize: "1.25rem" }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div style={{ 
          backgroundColor: "#f1f5f9", 
          padding: "20px 24px", 
          borderRadius: "12px", 
          marginBottom: "24px",
          borderLeft: "4px solid #3b82f6"
        }}>
          <p style={{ margin: 0, fontSize: "1rem", color: "#334155" }}>
            Showing <span style={{ fontWeight: 700, color: "#1e293b" }}>{data.count ?? posts.length}</span> results for <span style={{ fontWeight: 700, color: "#1e293b" }}>{data.keyword || keyword}</span>
          </p>
        </div>
      )}

      {!!posts.length && (
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "16px", 
          padding: "24px", 
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          overflow: "hidden"
        }}>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1e293b", margin: 0 }}>
              Results
            </h2>
            <span style={{ fontSize: "0.875rem", color: "#64748b", backgroundColor: "#f1f5f9", padding: "6px 12px", borderRadius: "20px" }}>
              {posts.length} posts
            </span>
          </div>
          
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1200px", tableLayout: "fixed" }}>
              {/* Remove whitespace by putting all <col> tags on the same line */}
              <colgroup><col style={{ width: "100px" }} /><col style={{ width: "120px" }} /><col style={{ width: "180px" }} /><col style={{ width: "350px" }} /><col style={{ width: "100px" }} /><col style={{ width: "80px" }} /><col style={{ width: "80px" }} /><col style={{ width: "120px" }} /></colgroup>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {colsToShow.map((c) => (
                    <th
                      key={c}
                      style={{
                        textAlign: "left",
                        padding: "16px",
                        whiteSpace: "nowrap",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        overflow: "hidden"
                      }}
                    >
                      {c.replace(/([A-Z])/g, ' $1').trim()}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {posts.map((p, idx) => (
                  <tr 
                    key={idx} 
                    style={{ 
                      backgroundColor: idx % 2 === 0 ? "white" : "#f8fafc",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "white" : "#f8fafc"}
                  >
                    {colsToShow.map((c) => {
                      const v = p?.[c] ?? "";
                      const displayValue = typeof v === "object" ? JSON.stringify(v) : String(v);

                      // clickable link for postUrl
                      if (c === "postUrl" && v) {
                        return (
                          <td key={c} style={{ borderBottom: "1px solid #e2e8f0", padding: "16px", verticalAlign: "top" }}>
                            <a 
                              href={v} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                backgroundColor: "#3b82f6",
                                color: "white",
                                textDecoration: "none",
                                borderRadius: "8px",
                                fontSize: "0.875rem",
                                fontWeight: 500,
                                transition: "all 0.2s",
                                whiteSpace: "nowrap"
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
                              onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
                            >
                              <span>🔗</span>
                              Open
                            </a>
                          </td>
                        );
                      }

                      // For authorProfileUrl, make it clickable
                      if (c === "authorProfileUrl" && v && typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'))) {
                        return (
                          <td key={c} style={{ borderBottom: "1px solid #e2e8f0", padding: "16px", verticalAlign: "top" }}>
                            <a 
                              href={v} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{
                                color: "#3b82f6",
                                textDecoration: "none",
                                wordBreak: "break-all",
                                display: "block",
                                maxWidth: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                              }}
                              title={v}
                            >
                              {displayValue}
                            </a>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={c}
                          style={{
                            borderBottom: "1px solid #e2e8f0",
                            padding: "16px",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                            verticalAlign: "top",
                            fontSize: "0.9375rem",
                            color: "#334155",
                            lineHeight: 1.5,
                            maxWidth: c === "text" ? "350px" : "auto",
                            overflow: "hidden"
                          }}
                          title={displayValue.length > 100 ? displayValue : undefined}
                        >
                          {c === "text" && displayValue.length > 200 
                            ? `${displayValue.substring(0, 200)}...` 
                            : displayValue
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        ::placeholder {
          color: #94a3b8;
        }
        
        table {
          word-break: break-word;
        }
        
        td {
          word-break: break-word;
          hyphens: auto;
        }
      `}</style>
    </div>
  );
}