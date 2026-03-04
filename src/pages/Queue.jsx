import React, { useState, useEffect, useMemo, useCallback } from "react";
import { API_URL, T, injectGlobalStyles } from "./shared";
import { Logo, PageShell, Spinner, StatusBadge, GhostBtn } from "./shared";

export default function Queue({ phone, onEdit, onBack }) {
  injectGlobalStyles();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res  = await fetch(`${API_URL}?mode=queue&phone=${encodeURIComponent(phone)}&t=${Date.now()}`);
        if (!res.ok) throw new Error("server");
        const data = await res.json();
        if (!cancelled) setTickets(data.reverse());
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [phone]);

  const counts = useMemo(() => ({
    total:    tickets.length,
    pending:  tickets.filter(t => t["Status"] === "PENDING").length,
    approved: tickets.filter(t => t["Status"] === "APPROVED").length,
    bounce:   tickets.filter(t => t["Status"] === "BOUNCE BACK").length,
  }), [tickets]);

  return (
    <PageShell maxW={520}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          aria-label="Go back"
          style={{
            background: "transparent", border: `1px solid ${T.border}`,
            color: T.muted, borderRadius: 8, padding: "6px 12px",
            cursor: "pointer", fontSize: 13, flexShrink: 0,
          }}
        >
          ← Back
        </button>
        <div>
          <div style={{ color: T.gold, fontSize: 18, fontWeight: 800, letterSpacing: "0.12em" }}>
            SUBMISSION QUEUE
          </div>
          <div style={{ color: T.muted, fontSize: 11 }}>
            {loading ? "Loading…" : `${counts.total} submission${counts.total !== 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      {/* Summary tiles */}
      {!loading && !error && counts.total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Pending",  val: counts.pending,  color: T.warn    },
            { label: "Approved", val: counts.approved, color: T.success },
            { label: "Bounce",   val: counts.bounce,   color: T.danger  },
          ].map(s => (
            <div key={s.label} style={{
              background: T.surface, borderRadius: 8, padding: "10px 12px",
              border: `1px solid ${T.border}`, textAlign: "center",
            }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.val}</div>
              <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* States */}
      {loading && (
        <div style={{ padding: 48, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 14, color: T.muted, fontSize: 13 }}>
          <Spinner size={28} />
          Loading queue…
        </div>
      )}

      {error && (
        <div style={{
          color: T.danger, textAlign: "center", padding: 32, fontSize: 14,
          background: "rgba(239,68,68,0.06)", borderRadius: 10,
          border: "1px solid rgba(239,68,68,0.2)",
        }}>
          ⚠ Failed to load — check your connection and try again.
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div style={{ color: T.muted, textAlign: "center", padding: 48 }}>
          No submissions found for this number.
        </div>
      )}

      {/* Ticket cards */}
      {tickets.map((ticket, i) => {
        const status   = ticket["Status"];
        const isBounce = status === "BOUNCE BACK";
        const isApproved = status === "APPROVED";
        const borderColor = isBounce ? T.danger : isApproved ? T.success : T.warn;
        return (
          <div key={ticket["Submission ID"] || i} style={{
            background: T.bg, borderRadius: 10, padding: 16, marginBottom: 12,
            border: `1px solid ${isBounce ? "rgba(239,68,68,0.25)" : T.border}`,
            borderLeft: `3px solid ${borderColor}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ color: T.text, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>
                {ticket["Submission ID"] || "—"}
              </div>
              <StatusBadge status={status} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 4 }}>
              {[
                ["Client",  ticket["Client"]],
                ["Date",    ticket["Service Date"] || ticket["Timestamp"]
                            ? new Date(ticket["Timestamp"]).toLocaleDateString() : "—"],
                ticket["Field Ticket #"] && ["Field Ticket", ticket["Field Ticket #"]],
                ticket["Driver"]         && ["Driver",       ticket["Driver"]],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: T.muted, fontSize: 10 }}>{k}</div>
                  <div style={{ color: T.text, fontSize: 13 }}>{v || "—"}</div>
                </div>
              ))}
            </div>

            {ticket["Notes"] && (
              <div style={{
                marginTop: 8, padding: "7px 10px", background: T.surface,
                borderRadius: 6, color: T.muted, fontSize: 12, fontStyle: "italic",
              }}>
                "{ticket["Notes"]}"
              </div>
            )}

            {isBounce && (
              <button
                onClick={() => onEdit(ticket)}
                style={{
                  marginTop: 12, width: "100%", padding: "10px 16px",
                  background: "rgba(212,175,55,0.08)",
                  border: `1px solid ${T.goldDim}`, color: T.gold,
                  borderRadius: 8, fontWeight: 700, fontSize: 12,
                  letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,175,55,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(212,175,55,0.08)")}
              >
                ✎ EDIT & RESUBMIT
              </button>
            )}
          </div>
        );
      })}
    </PageShell>
  );
}
