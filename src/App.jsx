import React, { useState, useMemo, useEffect, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_URL =
  "https://script.google.com/macros/s/AKfycbwS0QFVxrOt0dPJhAMiPAvIEaX3AekuXCrLtn3jAydu4cqgwGHIeGpvF_kIudbM6-0aGw/exec";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  gold:    "#D4AF37",
  goldDim: "#a88a20",
  bg:      "#07080a",
  card:    "#0e1015",
  surface: "#13161d",
  border:  "#1e2330",
  borderHi:"#2e3550",
  text:    "#e8eaf0",
  muted:   "#6b7394",
  danger:  "#ef4444",
  success: "#22c55e",
  warn:    "#f59e0b",
  info:    "#3b82f6",
};

// ─── GLOBAL STYLES injected once ─────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: ${T.bg}; color: ${T.text}; font-family: 'Inter', sans-serif; }
  input, select, textarea, button { font-family: inherit; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pop    { 0%{transform:scale(0.85);opacity:0} 60%{transform:scale(1.04)} 100%{transform:scale(1);opacity:1} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.5} }
  @keyframes shimmer{ 0%{background-position:-200% center} 100%{background-position:200% center} }
  .fadeUp   { animation: fadeUp 0.35s ease both; }
  .pop      { animation: pop 0.4s cubic-bezier(.34,1.56,.64,1) both; }
`;

function injectGlobalStyles() {
  if (document.getElementById("bd-global")) return;
  const s = document.createElement("style");
  s.id = "bd-global";
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ─── TINY SHARED UI ──────────────────────────────────────────────────────────

function Spinner({ size = 16, color = "#000" }) {
  return (
    <span style={{
      display:"inline-block", width:size, height:size,
      border:`2px solid rgba(0,0,0,0.2)`, borderTop:`2px solid ${color}`,
      borderRadius:"50%", animation:"spin 0.7s linear infinite", flexShrink:0
    }}/>
  );
}

function Label({ text, required }) {
  return (
    <div style={{ color: T.muted, fontSize: 10, fontWeight: 600,
      letterSpacing: "0.12em", textTransform:"uppercase", marginTop: 16, marginBottom: 6 }}>
      {text}{required && <span style={{ color: T.danger }}> ✱</span>}
    </div>
  );
}

function Input({ style, ...props }) {
  return (
    <input style={{
      width:"100%", padding:"10px 12px", background: T.surface,
      border:`1px solid ${T.border}`, color: T.text, borderRadius: 8,
      fontSize: 14, outline:"none", transition:"border-color 0.15s",
      ...style
    }}
    onFocus={e  => e.target.style.borderColor = T.goldDim}
    onBlur={e   => e.target.style.borderColor = T.border}
    {...props}
    />
  );
}

function Textarea({ style, ...props }) {
  return (
    <textarea style={{
      width:"100%", padding:"10px 12px", background: T.surface,
      border:`1px solid ${T.border}`, color: T.text, borderRadius: 8,
      fontSize: 14, resize:"vertical", minHeight: 100, outline:"none",
      lineHeight: 1.6, transition:"border-color 0.15s", ...style
    }}
    onFocus={e  => e.target.style.borderColor = T.goldDim}
    onBlur={e   => e.target.style.borderColor = T.border}
    {...props}
    />
  );
}

function Select({ children, style, ...props }) {
  return (
    <select style={{
      width:"100%", padding:"10px 12px", background: T.surface,
      border:`1px solid ${T.border}`, color: T.text, borderRadius: 8,
      fontSize: 14, outline:"none", appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7394' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat", backgroundPosition:"right 12px center",
      transition:"border-color 0.15s", ...style
    }}
    onFocus={e  => e.target.style.borderColor = T.goldDim}
    onBlur={e   => e.target.style.borderColor = T.border}
    {...props}
    >
      {children}
    </select>
  );
}

function GoldBtn({ children, disabled, loading, onClick, style }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{
        width:"100%", padding:"13px 16px", background: disabled ? "#2a2d38" : T.gold,
        color: disabled ? T.muted : "#000", border:"none", borderRadius: 8,
        fontWeight: 700, fontSize: 13, letterSpacing:"0.1em",
        cursor: disabled ? "not-allowed" : "pointer",
        display:"flex", alignItems:"center", justifyContent:"center", gap: 8,
        transition:"all 0.15s", opacity: loading ? 0.85 : 1,
        fontFamily:"'Rajdhani', sans-serif", ...style
      }}>
      {loading && <Spinner size={14} color={disabled?"#6b7394":"#000"}/>}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, style }) {
  return (
    <button onClick={onClick}
      style={{
        width:"100%", padding:"12px 16px", background:"transparent",
        color: T.text, border:`1px solid ${T.border}`, borderRadius: 8,
        fontWeight: 600, fontSize: 13, letterSpacing:"0.08em",
        cursor:"pointer", transition:"all 0.15s",
        fontFamily:"'Rajdhani', sans-serif", ...style
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = T.surface; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

function PageShell({ children, maxW = 480 }) {
  return (
    <div style={{
      background: T.bg, minHeight:"100vh", width:"100%",
      display:"flex", justifyContent:"center", alignItems:"flex-start",
      padding:"24px 12px 48px", boxSizing:"border-box"
    }}>
      <div className="fadeUp" style={{
        width:"100%", maxWidth: maxW, background: T.card,
        borderRadius: 14, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding: "24px 20px",
        boxShadow:"0 20px 60px rgba(0,0,0,0.6)"
      }}>
        {children}
      </div>
    </div>
  );
}

function Logo({ sub }) {
  return (
    <div style={{ textAlign:"center", marginBottom: 24 }}>
      <div style={{
        color: T.gold, fontSize: 11, fontWeight: 700,
        letterSpacing:"0.4em", fontFamily:"'Rajdhani',sans-serif"
      }}>BLACK DROP TRUCKING</div>
      <div style={{
        color: T.gold, fontSize: 22, fontWeight: 700,
        letterSpacing:"0.18em", fontFamily:"'Rajdhani',sans-serif", marginTop: 2
      }}>{sub}</div>
      <div style={{ width: 40, height: 2, background: T.gold, margin:"8px auto 0" }}/>
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    "PENDING":     { color: T.warn,    bg:"rgba(245,158,11,0.12)",  dot:"#f59e0b" },
    "APPROVED":    { color: T.success, bg:"rgba(34,197,94,0.12)",   dot:"#22c55e" },
    "BOUNCE BACK": { color: T.danger,  bg:"rgba(239,68,68,0.12)",   dot:"#ef4444" },
  };
  const s = map[status] || { color: T.muted, bg: T.surface, dot: T.muted };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap: 6,
      padding:"3px 10px", borderRadius: 99, background: s.bg,
      color: s.color, fontSize: 11, fontWeight: 700, letterSpacing:"0.08em"
    }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background: s.dot,
        animation: status === "PENDING" ? "pulse 1.5s ease infinite" : "none" }}/>
      {status}
    </span>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [phone, setPhone]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleLogin() {
    if (!phone || phone.length < 7) { setError("Enter a valid phone number."); return; }
    if (loading) return;
    setError(""); setLoading(true);
    try {
      const res  = await fetch(API_URL + "?t=" + Date.now());
      if (!res.ok) throw new Error("Server error");
      const list = await res.json();
      const ok   = list.some(p => String(p).trim() === phone.trim());
      if (ok) { onLogin(phone.trim()); }
      else    { setError("This number is not authorized."); setLoading(false); }
    } catch {
      setError("Connection failed. Check your signal.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      background: T.bg, minHeight:"100vh", display:"flex",
      justifyContent:"center", alignItems:"center", padding: 16
    }}>
      <div className="pop" style={{
        width:"100%", maxWidth: 360, background: T.card,
        borderRadius: 16, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding: "32px 24px",
        boxShadow:"0 24px 80px rgba(0,0,0,0.7)"
      }}>
        <Logo sub="FIELD COMMAND" />

        <Label text="Phone Number" required/>
        <Input
          type="tel" inputMode="numeric" autoComplete="tel"
          placeholder="e.g. 4325551234"
          value={phone}
          maxLength={15}
          onChange={e => { setPhone(e.target.value.replace(/\D/g,"")); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />

        {error && (
          <div style={{ color: T.danger, fontSize: 12, marginTop: 8, textAlign:"center" }}>
            ⚠ {error}
          </div>
        )}

        <GoldBtn style={{ marginTop: 20 }} loading={loading} onClick={handleLogin}>
          {loading ? "VERIFYING..." : "ENTER FIELD COMMAND"}
        </GoldBtn>

        <div style={{ color: T.muted, fontSize: 11, textAlign:"center", marginTop: 16 }}>
          🔒 Authorized personnel only
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ phone, onLogout, onStartTicket, onOpenQueue }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{
      background: T.bg, minHeight:"100vh", display:"flex",
      justifyContent:"center", alignItems:"center", padding: 16
    }}>
      <div className="pop" style={{
        width:"100%", maxWidth: 380, background: T.card,
        borderRadius: 16, border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, padding:"32px 24px",
        boxShadow:"0 24px 80px rgba(0,0,0,0.7)"
      }}>
        <Logo sub="FIELD COMMAND" />

        <div style={{
          background: T.surface, borderRadius: 10, padding:"14px 16px",
          marginBottom: 24, border:`1px solid ${T.border}`,
          display:"flex", alignItems:"center", gap: 12
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background:`rgba(212,175,55,0.12)`, border:`1px solid ${T.goldDim}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize: 16
          }}>👷</div>
          <div>
            <div style={{ color: T.muted, fontSize: 10, letterSpacing:"0.1em" }}>{greeting}</div>
            <div style={{ color: T.text, fontWeight: 600, fontSize: 14 }}>{phone}</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap: 10 }}>
          <GoldBtn onClick={onStartTicket}>
            📋 SUBMIT NEW TICKET
          </GoldBtn>
          <GhostBtn onClick={onOpenQueue}>
            📥 SUBMISSION QUEUE
          </GhostBtn>
          <GhostBtn onClick={onLogout} style={{ color: T.muted, borderColor:"#1a1d26" }}>
            ← LOG OUT
          </GhostBtn>
        </div>

        <div style={{
          marginTop: 24, paddingTop: 16, borderTop:`1px solid ${T.border}`,
          color: T.muted, fontSize: 10, textAlign:"center", letterSpacing:"0.1em"
        }}>
          BLACK DROP TRUCKING LLC · FIELD SYSTEM
        </div>
      </div>
    </div>
  );
}

// ─── QUEUE PAGE ───────────────────────────────────────────────────────────────
function Queue({ phone, onEdit, onBack }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`${API_URL}?mode=queue&phone=${phone}&t=${Date.now()}`);
        const data = await res.json();
        setTickets(data.reverse());
      } catch { setError(true); }
      finally  { setLoading(false); }
    }
    load();
  }, [phone]);

  const counts = useMemo(() => ({
    total:   tickets.length,
    pending: tickets.filter(t => t["Status"] === "PENDING").length,
    bounce:  tickets.filter(t => t["Status"] === "BOUNCE BACK").length,
    approved:tickets.filter(t => t["Status"] === "APPROVED").length,
  }), [tickets]);

  return (
    <PageShell maxW={520}>
      <div style={{ display:"flex", alignItems:"center", gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{
          background:"transparent", border:`1px solid ${T.border}`,
          color: T.muted, borderRadius: 8, padding:"6px 10px", cursor:"pointer", fontSize: 13
        }}>← Back</button>
        <div>
          <div style={{ color: T.gold, fontFamily:"'Rajdhani',sans-serif",
            fontSize: 18, fontWeight: 700, letterSpacing:"0.12em" }}>SUBMISSION QUEUE</div>
          <div style={{ color: T.muted, fontSize: 11 }}>{counts.total} submissions found</div>
        </div>
      </div>

      {/* Stats row */}
      {!loading && !error && counts.total > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            { label:"Pending",  val: counts.pending,  color: T.warn },
            { label:"Approved", val: counts.approved, color: T.success },
            { label:"Bounce",   val: counts.bounce,   color: T.danger },
          ].map(s => (
            <div key={s.label} style={{
              background: T.surface, borderRadius: 8, padding:"10px 12px",
              border:`1px solid ${T.border}`, textAlign:"center"
            }}>
              <div style={{ color: s.color, fontSize: 22, fontWeight: 700,
                fontFamily:"'Space Mono',monospace" }}>{s.val}</div>
              <div style={{ color: T.muted, fontSize: 10, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ color: T.muted, textAlign:"center", padding: 40,
          display:"flex", flexDirection:"column", alignItems:"center", gap: 12 }}>
          <Spinner size={24} color={T.gold}/>
          Loading queue...
        </div>
      )}

      {error && (
        <div style={{ color: T.danger, textAlign:"center", padding: 32 }}>
          ⚠ Failed to load. Check your connection.
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div style={{ color: T.muted, textAlign:"center", padding: 40 }}>
          No submissions found for this number.
        </div>
      )}

      {tickets.map((ticket, i) => {
        const status = ticket["Status"];
        const isBounce = status === "BOUNCE BACK";
        return (
          <div key={ticket["Submission ID"] || i} style={{
            background: T.surface, borderRadius: 10, padding: 16, marginBottom: 12,
            border:`1px solid ${isBounce ? "rgba(239,68,68,0.3)" : T.border}`,
            borderLeft:`3px solid ${isBounce ? T.danger : status === "APPROVED" ? T.success : T.warn}`
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom: 10 }}>
              <div style={{ fontFamily:"'Space Mono',monospace", color: T.text, fontSize: 12, fontWeight: 700 }}>
                {ticket["Submission ID"]}
              </div>
              <StatusBadge status={status}/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 16px" }}>
              {[
                ["Client",  ticket["Client"]],
                ["Created", ticket["Timestamp"] ? new Date(ticket["Timestamp"]).toLocaleString() : "—"],
                ticket["Field Ticket #"] ? ["Field Ticket", ticket["Field Ticket #"]] : null,
                ticket["Driver"]         ? ["Driver",       ticket["Driver"]]         : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k}>
                  <div style={{ color: T.muted, fontSize: 10 }}>{k}</div>
                  <div style={{ color: T.text, fontSize: 13 }}>{v}</div>
                </div>
              ))}
            </div>

            {ticket["Notes"] && (
              <div style={{
                marginTop: 10, padding:"8px 10px", background: T.bg,
                borderRadius: 6, color: T.muted, fontSize: 12, fontStyle:"italic"
              }}>
                "{ticket["Notes"]}"
              </div>
            )}

            {isBounce && (
              <button onClick={() => onEdit(ticket)} style={{
                marginTop: 12, width:"100%", padding:"10px 16px",
                background:`rgba(212,175,55,0.1)`, border:`1px solid ${T.goldDim}`,
                color: T.gold, borderRadius: 8, fontWeight: 700, fontSize: 12,
                letterSpacing:"0.1em", cursor:"pointer",
                fontFamily:"'Rajdhani',sans-serif", transition:"all 0.15s"
              }}
              onMouseEnter={e => e.currentTarget.style.background = `rgba(212,175,55,0.2)`}
              onMouseLeave={e => e.currentTarget.style.background = `rgba(212,175,55,0.1)`}
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

// ─── TICKET SUCCESS ───────────────────────────────────────────────────────────
function TicketSuccess({ onBack }) {
  return (
    <div style={{
      position:"fixed", inset:0, background: T.bg,
      display:"flex", justifyContent:"center", alignItems:"center", zIndex: 9999
    }}>
      <div className="pop" style={{
        background: T.card, padding:"48px 40px", borderRadius: 16,
        textAlign:"center", border:`1px solid ${T.border}`,
        borderLeft:`3px solid ${T.gold}`, maxWidth: 360, width:"90%"
      }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✓</div>
        <div style={{
          color: T.gold, fontFamily:"'Rajdhani',sans-serif",
          fontSize: 24, fontWeight: 700, letterSpacing:"0.1em", marginBottom: 8
        }}>TICKET SUBMITTED</div>
        <div style={{ color: T.muted, fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          Your field ticket has been received and is pending review.
        </div>
        <GoldBtn onClick={onBack}>← BACK TO DASHBOARD</GoldBtn>
      </div>
    </div>
  );
}

// ─── ADVANCED DOCUMENT SCANNER (CamScanner-level) ────────────────────────────
function ScannerModal({ open, onClose, onUse }) {
  const [stage,       setStage]       = useState("capture"); // capture | adjust | enhance
  const [docDetected, setDocDetected] = useState(false);
  const [autoCapture, setAutoCapture] = useState(true);
  const [stableCount, setStableCount] = useState(0);
  const [corners,     setCorners]     = useState(null);
  const [dragIdx,     setDragIdx]     = useState(null);
  const [filter,      setFilter]      = useState("document");
  const [processing,  setProcessing]  = useState(false);
  const [finalImage,  setFinalImage]  = useState(null);
  const [ready,       setReady]       = useState(false);
  const [camError,    setCamError]    = useState(false);
  const [liveCorners, setLiveCorners] = useState(null); // detected corners on live feed

  const videoRef      = useRef(null);
  const streamRef     = useRef(null);
  const captureCanv   = useRef(null);
  const adjustCanv    = useRef(null);
  const outputCanv    = useRef(null);
  const fileInputRef  = useRef(null);
  const imgRef        = useRef(null);
  const dragRef       = useRef(null);
  const detectionLoop = useRef(null);
  const stableRef     = useRef(0);
  const prevCornersRef= useRef(null);
  const autoCaptRef   = useRef(true);

  autoCaptRef.current = autoCapture;

  // ── camera start/stop
  useEffect(() => {
    if (!open) return;
    setStage("capture"); setDocDetected(false); setCorners(null);
    setLiveCorners(null); setFilter("document"); setFinalImage(null);
    setProcessing(false); setReady(false); setCamError(false);
    stableRef.current = 0;
    let active = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width:  { ideal: 3840, min: 1280 },
            height: { ideal: 2160, min: 720 },
            focusMode: "continuous",
          }
        });
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        setCamError(true);
        setReady(false);
      }
    })();

    return () => {
      active = false;
      stopCamera();
    };
  }, [open]);

  function stopCamera() {
    if (detectionLoop.current) { cancelAnimationFrame(detectionLoop.current); detectionLoop.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }

  // ── live edge detection loop
  useEffect(() => {
    if (!ready || stage !== "capture") return;
    let frameId;
    const detect = () => {
      runLiveDetection();
      frameId = requestAnimationFrame(detect);
    };
    frameId = requestAnimationFrame(detect);
    detectionLoop.current = frameId;
    return () => { if (frameId) cancelAnimationFrame(frameId); };
  }, [ready, stage]);

  // ── sample video every ~200ms for edge detection (throttled)
  const lastDetectTime = useRef(0);
  function runLiveDetection() {
    const now = Date.now();
    if (now - lastDetectTime.current < 180) return;
    lastDetectTime.current = now;

    const v = videoRef.current;
    if (!v || v.readyState < 2) return;

    const W = 320, H = 240; // small for speed
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.drawImage(v, 0, 0, W, H);

    try {
      const detected = detectDocumentCorners(ctx, W, H);
      if (detected) {
        setLiveCorners(detected);
        setDocDetected(true);

        // Check stability for auto-capture
        if (prevCornersRef.current && autoCaptRef.current) {
          const moved = detected.reduce((sum, p, i) => {
            const pp = prevCornersRef.current[i];
            return sum + Math.hypot(p.x - pp.x, p.y - pp.y);
          }, 0);
          if (moved < 0.03) {
            stableRef.current++;
            setStableCount(stableRef.current);
            if (stableRef.current >= 5) { // stable for ~1 second
              captureNow();
              return;
            }
          } else {
            stableRef.current = 0;
            setStableCount(0);
          }
        }
        prevCornersRef.current = detected;
      } else {
        setDocDetected(false);
        setLiveCorners(null);
        stableRef.current = 0;
        setStableCount(0);
        prevCornersRef.current = null;
      }
    } catch(_) {}
  }

  // ── Sobel edge detection + rectangle finding
  function detectDocumentCorners(ctx, W, H) {
    const px = ctx.getImageData(0, 0, W, H).data;
    const gray = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++)
      gray[i] = 0.299*px[i*4] + 0.587*px[i*4+1] + 0.114*px[i*4+2];

    // Sobel
    const edge = new Float32Array(W * H);
    let maxE = 0;
    for (let y = 1; y < H-1; y++) {
      for (let x = 1; x < W-1; x++) {
        const gx = -gray[(y-1)*W+(x-1)] - 2*gray[y*W+(x-1)] - gray[(y+1)*W+(x-1)]
                 +  gray[(y-1)*W+(x+1)] + 2*gray[y*W+(x+1)] + gray[(y+1)*W+(x+1)];
        const gy = -gray[(y-1)*W+(x-1)] - 2*gray[(y-1)*W+x] - gray[(y-1)*W+(x+1)]
                 +  gray[(y+1)*W+(x-1)] + 2*gray[(y+1)*W+x] + gray[(y+1)*W+(x+1)];
        const e = Math.sqrt(gx*gx + gy*gy);
        edge[y*W+x] = e;
        if (e > maxE) maxE = e;
      }
    }

    if (maxE < 10) return null;
    const thresh = maxE * 0.20;

    let minX=W, maxX=0, minY=H, maxY=0, found=false;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (edge[y*W+x] > thresh) {
          if (x<minX)minX=x; if(x>maxX)maxX=x;
          if (y<minY)minY=y; if(y>maxY)maxY=y;
          found = true;
        }
      }
    }

    if (!found) return null;
    const rw = (maxX-minX)/W, rh = (maxY-minY)/H;
    if (rw < 0.25 || rh < 0.25 || rw > 0.98 || rh > 0.98) return null;

    const pad = 0.015;
    return [
      { x: Math.max(0.01, minX/W - pad), y: Math.max(0.01, minY/H - pad) },
      { x: Math.min(0.99, maxX/W + pad), y: Math.max(0.01, minY/H - pad) },
      { x: Math.min(0.99, maxX/W + pad), y: Math.min(0.99, maxY/H + pad) },
      { x: Math.max(0.01, minX/W - pad), y: Math.min(0.99, maxY/H + pad) },
    ];
  }

  // ── CAPTURE
  function captureNow() {
    if (detectionLoop.current) { cancelAnimationFrame(detectionLoop.current); detectionLoop.current = null; }
    const v = videoRef.current;
    if (!v) return;
    const c = captureCanv.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.97);

    stopCamera();

    // Load full res image and run high-res edge detection
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // Run detection on full res
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const W2 = Math.round(img.width*scale), H2 = Math.round(img.height*scale);
      const tmp = document.createElement("canvas");
      tmp.width=W2; tmp.height=H2;
      const tctx = tmp.getContext("2d");
      tctx.drawImage(img, 0, 0, W2, H2);
      const det = detectDocumentCorners(tctx, W2, H2);
      setCorners(det || defaultCorners());
      setStage("adjust");
      setProcessing(false);
    };
    img.src = dataUrl;
    setProcessing(true);
  }

  function handleFile(e) {
    const f = e.target.files[0]; if (!f) return;
    stopCamera();
    setProcessing(true);
    const r = new FileReader();
    r.onload = ev => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        captureCanv.current.width = img.width;
        captureCanv.current.height = img.height;
        captureCanv.current.getContext("2d").drawImage(img, 0, 0);
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const W2=Math.round(img.width*scale), H2=Math.round(img.height*scale);
        const tmp=document.createElement("canvas"); tmp.width=W2; tmp.height=H2;
        const tctx=tmp.getContext("2d"); tctx.drawImage(img,0,0,W2,H2);
        const det=detectDocumentCorners(tctx,W2,H2);
        setCorners(det || defaultCorners());
        setProcessing(false);
        setStage("adjust");
      };
      img.src = ev.target.result;
    };
    r.readAsDataURL(f);
    e.target.value="";
  }

  function defaultCorners() {
    const p=0.06;
    return [{x:p,y:p},{x:1-p,y:p},{x:1-p,y:1-p},{x:p,y:1-p}];
  }

  // ── draw adjustment canvas
  useEffect(() => {
    if (stage!=="adjust"||!corners||!adjustCanv.current||!imgRef.current) return;
    drawAdjust(corners);
  }, [stage, corners]);

  function drawAdjust(C) {
    const canvas = adjustCanv.current, img = imgRef.current;
    if (!canvas||!img) return;
    const vw = window.innerWidth - 32;
    const vh = window.innerHeight * 0.60;
    const scale = Math.min(vw/img.width, vh/img.height, 1);
    canvas.width  = Math.round(img.width  * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const pts = C.map(c => ({ x: c.x*canvas.width, y: c.y*canvas.height }));

    // Dim outside
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Clear inside polygon
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
    ctx.globalCompositeOperation="destination-out"; ctx.fill();
    ctx.restore();

    // Redraw image inside
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath();
    ctx.clip(); ctx.drawImage(img,0,0,canvas.width,canvas.height);
    ctx.restore();

    // Border glow
    ctx.shadowColor="#D4AF37"; ctx.shadowBlur=8;
    ctx.strokeStyle="#D4AF37"; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath(); ctx.stroke();
    ctx.shadowBlur=0;

    // Corner handles — large for mobile
    pts.forEach((p,i)=>{
      // outer ring
      ctx.beginPath(); ctx.arc(p.x,p.y,22,0,Math.PI*2);
      ctx.fillStyle="rgba(212,175,55,0.2)"; ctx.fill();
      // inner circle
      ctx.beginPath(); ctx.arc(p.x,p.y,14,0,Math.PI*2);
      ctx.fillStyle=dragRef.current===i?"#ffffff":"#D4AF37"; ctx.fill();
      ctx.strokeStyle="rgba(0,0,0,0.6)"; ctx.lineWidth=2; ctx.stroke();
      // crosshair
      ctx.strokeStyle=dragRef.current===i?"#000":"rgba(0,0,0,0.7)";
      ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(p.x-6,p.y); ctx.lineTo(p.x+6,p.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x,p.y-6); ctx.lineTo(p.x,p.y+6); ctx.stroke();
    });
  }

  function getXY(e) {
    const canvas=adjustCanv.current;
    const rect=canvas.getBoundingClientRect();
    const scX=canvas.width/rect.width, scY=canvas.height/rect.height;
    const src=e.touches?e.touches[0]:e;
    return { x:(src.clientX-rect.left)*scX, y:(src.clientY-rect.top)*scY };
  }

  function onPtrDown(e) {
    e.preventDefault();
    const {x,y}=getXY(e);
    const canvas=adjustCanv.current;
    const pts=corners.map(c=>({x:c.x*canvas.width,y:c.y*canvas.height}));
    const hit=pts.findIndex(p=>Math.hypot(p.x-x,p.y-y)<32);
    if(hit!==-1){dragRef.current=hit;setDragIdx(hit);}
  }

  function onPtrMove(e) {
    if(dragRef.current===null)return;
    e.preventDefault();
    const {x,y}=getXY(e);
    const canvas=adjustCanv.current;
    const newC=corners.map((c,i)=>i===dragRef.current
      ?{x:Math.max(0.01,Math.min(0.99,x/canvas.width)),y:Math.max(0.01,Math.min(0.99,y/canvas.height))}:c);
    setCorners(newC);
    drawAdjust(newC);
  }

  function onPtrUp(){dragRef.current=null;setDragIdx(null);}

  // ── PERSPECTIVE WARP + ENHANCEMENT
  function processDocument(selectedFilter) {
    setProcessing(true);
    setTimeout(()=>{
      try {
        const img=imgRef.current;
        const W=img.width, H=img.height;
        const pts=corners.map(c=>({x:c.x*W,y:c.y*H}));

        const wT=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);
        const wB=Math.hypot(pts[2].x-pts[3].x,pts[2].y-pts[3].y);
        const hL=Math.hypot(pts[3].x-pts[0].x,pts[3].y-pts[0].y);
        const hR=Math.hypot(pts[2].x-pts[1].x,pts[2].y-pts[1].y);

        // Scale up output for better resolution
        const SCALE = Math.min(2.5, 3000 / Math.max(Math.max(wT,wB), Math.max(hL,hR)));
        const outW=Math.round(Math.max(wT,wB)*SCALE);
        const outH=Math.round(Math.max(hL,hR)*SCALE);

        // Source pixels
        const srcC=document.createElement("canvas");
        srcC.width=W; srcC.height=H;
        const srcCtx=srcC.getContext("2d");
        srcCtx.drawImage(img,0,0);
        const srcPx=srcCtx.getImageData(0,0,W,H).data;

        const dstC=outputCanv.current;
        dstC.width=outW; dstC.height=outH;
        const dstCtx=dstC.getContext("2d");
        const dstData=dstCtx.createImageData(outW,outH);
        const d=dstData.data;

        // Bilinear perspective warp with upscaling
        for(let dy=0;dy<outH;dy++){
          const v=dy/outH;
          for(let dx=0;dx<outW;dx++){
            const u=dx/outW;
            const sx=(1-u)*(1-v)*pts[0].x+u*(1-v)*pts[1].x+u*v*pts[2].x+(1-u)*v*pts[3].x;
            const sy=(1-u)*(1-v)*pts[0].y+u*(1-v)*pts[1].y+u*v*pts[2].y+(1-u)*v*pts[3].y;
            const x0=Math.floor(sx),y0=Math.floor(sy);
            const x1=Math.min(x0+1,W-1),y1=Math.min(y0+1,H-1);
            const fx=sx-x0,fy=sy-y0;
            const di=(dy*outW+dx)*4;
            for(let ch=0;ch<3;ch++){
              const tl=srcPx[(y0*W+x0)*4+ch];
              const tr=srcPx[(y0*W+x1)*4+ch];
              const bl=srcPx[(y1*W+x0)*4+ch];
              const br=srcPx[(y1*W+x1)*4+ch];
              d[di+ch]=Math.round(tl*(1-fx)*(1-fy)+tr*fx*(1-fy)+bl*(1-fx)*fy+br*fx*fy);
            }
            d[di+3]=255;
          }
        }
        dstCtx.putImageData(dstData,0,0);

        // Apply professional enhancement pipeline
        enhanceDocument(dstCtx, outW, outH, selectedFilter);

        setFinalImage(dstC.toDataURL("image/jpeg", 0.94));
        setFilter(selectedFilter);
        setProcessing(false);
        setStage("enhance");
      } catch(err) {
        console.error(err);
        setProcessing(false);
      }
    }, 40);
  }

  // ── PROFESSIONAL DOCUMENT ENHANCEMENT PIPELINE
  function enhanceDocument(ctx, W, H, mode) {
    const id=ctx.getImageData(0,0,W,H);
    const d=id.data;

    // Step 1: Estimate background (paper) brightness using corner samples
    const samples=[];
    [[0,0],[W-1,0],[0,H-1],[W-1,H-1],[W>>1,0],[0,H>>1],[W-1,H>>1],[W>>1,H-1]].forEach(([x,y])=>{
      const xi=Math.min(x,W-1), yi=Math.min(y,H-1);
      const i=(yi*W+xi)*4;
      samples.push(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);
    });
    const bgBrightness=samples.reduce((a,b)=>a+b,0)/samples.length;
    const brightnessBoost = bgBrightness < 200 ? (220/Math.max(bgBrightness,40)) : 1.0;

    if(mode==="document"){
      // Professional document mode: white paper, dark text
      for(let i=0;i<d.length;i+=4){
        let r=d[i],g=d[i+1],b=d[i+2];
        const lum=0.299*r+0.587*g+0.114*b;

        // Normalize brightness so paper becomes white
        r=Math.min(255,r*brightnessBoost);
        g=Math.min(255,g*brightnessBoost);
        b=Math.min(255,b*brightnessBoost);

        // Adaptive contrast: push darks darker, lights lighter
        const newLum=0.299*r+0.587*g+0.114*b;
        const contrast=1.6;
        r=Math.min(255,Math.max(0,(r-128)*contrast+148));
        g=Math.min(255,Math.max(0,(g-128)*contrast+148));
        b=Math.min(255,Math.max(0,(b-128)*contrast+148));

        // Desaturate slightly — makes paper crisper
        const final_lum=0.299*r+0.587*g+0.114*b;
        const sat=0.25; // reduce saturation 75%
        d[i]  =Math.round(r*sat+final_lum*(1-sat));
        d[i+1]=Math.round(g*sat+final_lum*(1-sat));
        d[i+2]=Math.round(b*sat+final_lum*(1-sat));
      }
    } else if(mode==="bw"){
      for(let i=0;i<d.length;i+=4){
        let lum=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])*brightnessBoost;
        lum=Math.min(255,lum);
        // S-curve for pure black and white feel
        lum=lum<128?Math.max(0,lum*0.7):Math.min(255,55+(lum-128)*1.55);
        d[i]=d[i+1]=d[i+2]=Math.round(lum);
      }
    } else if(mode==="highcontrast"){
      for(let i=0;i<d.length;i+=4){
        let lum=(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2])*brightnessBoost;
        // Hard threshold for maximum readability
        lum=lum<100?Math.max(0,lum*0.5):Math.min(255,80+(lum-100)*1.8);
        d[i]=d[i+1]=d[i+2]=Math.round(lum);
      }
    } else if(mode==="sharp"){
      // Sharpened text mode — boost contrast + heavy unsharp
      for(let i=0;i<d.length;i+=4){
        let r=Math.min(255,d[i]*brightnessBoost);
        let g=Math.min(255,d[i+1]*brightnessBoost);
        let b=Math.min(255,d[i+2]*brightnessBoost);
        d[i]  =Math.min(255,Math.max(0,(r-128)*1.45+148));
        d[i+1]=Math.min(255,Math.max(0,(g-128)*1.45+148));
        d[i+2]=Math.min(255,Math.max(0,(b-128)*1.35+138));
      }
    }
    // else "original" — no color change

    ctx.putImageData(id,0,0);

    if(mode!=="original"){
      // Unsharp mask — makes text crisp and readable
      unsharpMask(ctx,W,H, mode==="highcontrast"||mode==="sharp"?2.2:1.8);
    }
  }

  function unsharpMask(ctx, W, H, strength) {
    const id=ctx.getImageData(0,0,W,H);
    const d=id.data;
    const blurred=fastBoxBlur(new Uint8ClampedArray(d),W,H,2);
    for(let i=0;i<d.length;i+=4){
      for(let c=0;c<3;c++){
        d[i+c]=Math.min(255,Math.max(0, d[i+c]*(1+strength) - blurred[i+c]*strength));
      }
    }
    ctx.putImageData(id,0,0);
  }

  function fastBoxBlur(data,W,H,r){
    const tmp=new Uint8ClampedArray(data.length);
    const out=new Uint8ClampedArray(data.length);
    // Horizontal
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        let rv=0,gv=0,bv=0,n=0;
        for(let dx=-r;dx<=r;dx++){
          const xi=Math.max(0,Math.min(W-1,x+dx)),i=(y*W+xi)*4;
          rv+=data[i];gv+=data[i+1];bv+=data[i+2];n++;
        }
        const i=(y*W+x)*4;tmp[i]=rv/n;tmp[i+1]=gv/n;tmp[i+2]=bv/n;tmp[i+3]=255;
      }
    }
    // Vertical
    for(let x=0;x<W;x++){
      for(let y=0;y<H;y++){
        let rv=0,gv=0,bv=0,n=0;
        for(let dy=-r;dy<=r;dy++){
          const yi=Math.max(0,Math.min(H-1,y+dy)),i=(yi*W+x)*4;
          rv+=tmp[i];gv+=tmp[i+1];bv+=tmp[i+2];n++;
        }
        const i=(y*W+x)*4;out[i]=rv/n;out[i+1]=gv/n;out[i+2]=bv/n;out[i+3]=255;
      }
    }
    return out;
  }

  function reapplyFilter(f) {
    if(processing)return;
    setProcessing(true);
    setTimeout(()=>{
      // Re-warp with new filter
      processDocument(f);
    },20);
  }

  if(!open)return null;

  const FILTERS=[
    {id:"document",    icon:"📄", label:"Document",    desc:"White paper, sharp text"},
    {id:"bw",          icon:"◑",  label:"B&W Scan",     desc:"Classic monochrome"},
    {id:"highcontrast",icon:"◆",  label:"High Contrast",desc:"Max readability"},
    {id:"sharp",       icon:"🔍", label:"Sharpened",    desc:"Enhanced text + numbers"},
    {id:"original",    icon:"⬜", label:"Original",     desc:"No processing"},
  ];

  const outW=outputCanv.current?.width||0;
  const outH=outputCanv.current?.height||0;
  const mpx=outW&&outH?((outW*outH)/1e6).toFixed(1):null;

  return (
    <div style={{
      position:"fixed",inset:0,background:"#000",
      display:"flex",flexDirection:"column",zIndex:9999,
      fontFamily:"'Rajdhani','Inter',sans-serif",
      touchAction:"none", userSelect:"none",
    }}>

      {/* ══ STAGE 1: LIVE CAMERA ══ */}
      {stage==="capture" && (
        <>
          {/* Full-screen camera */}
          <div style={{flex:1,position:"relative",overflow:"hidden",background:"#000"}}>
            <video ref={videoRef} playsInline autoPlay muted
              style={{
                width:"100%", height:"100%",
                objectFit:"cover",
                display:camError?"none":"block"
              }}/>

            {/* Real-time edge detection overlay */}
            {!camError && ready && (
              <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
                {/* Corner guides always visible */}
                {!liveCorners && <>
                  {/* Guide rectangle */}
                  <rect x="8%" y="12%" width="84%" height="76%" rx="6"
                    fill="rgba(0,0,0,0.08)"
                    stroke="rgba(212,175,55,0.4)" strokeWidth="1.5" strokeDasharray="12 5"/>
                  {/* Corner L-brackets */}
                  {[
                    {x:"8%",y:"12%",r:0},
                    {x:"92%",y:"12%",r:90},
                    {x:"92%",y:"88%",r:180},
                    {x:"8%",y:"88%",r:270}
                  ].map(({x,y,r},i)=>(
                    <g key={i} transform={`rotate(${r},${x},${y})`}>
                      <line x1={x} y1={y} x2={`calc(${x} + 20px)`} y2={y} stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
                      <line x1={x} y1={y} x2={x} y2={`calc(${y} + 20px)`} stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
                    </g>
                  ))}
                </>}

                {/* Live detected document outline */}
                {liveCorners && (() => {
                  const W=100,H=100;
                  const pts=liveCorners.map(c=>({x:c.x*W+"%",y:c.y*H+"%"}));
                  const pStr=pts.map(p=>`${p.x},${p.y}`).join(" ");
                  return <>
                    {/* Glow effect */}
                    <polygon points={pStr}
                      fill="rgba(34,197,94,0.08)"
                      stroke={docDetected?"#22c55e":"#D4AF37"}
                      strokeWidth="2.5"
                      filter="url(#glow)"/>
                    <defs>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    {/* Corner dots */}
                    {liveCorners.map((c,i)=>(
                      <circle key={i} cx={c.x*100+"%"} cy={c.y*100+"%"} r="5"
                        fill={docDetected?"#22c55e":"#D4AF37"}/>
                    ))}
                  </>;
                })()}
              </svg>
            )}

            {/* Status pill */}
            {!camError && (
              <div style={{
                position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",
                background:docDetected?"rgba(34,197,94,0.15)":"rgba(0,0,0,0.6)",
                border:`1px solid ${docDetected?"#22c55e":"rgba(212,175,55,0.4)"}`,
                color:docDetected?"#22c55e":T.gold,
                padding:"6px 18px",borderRadius:99,fontSize:12,
                fontWeight:700,letterSpacing:"0.1em",whiteSpace:"nowrap",
                backdropFilter:"blur(8px)",
                transition:"all 0.3s ease",
              }}>
                {docDetected
                  ? (autoCapture && stableCount>0
                      ? `📄 HOLD STILL — AUTO-CAPTURING...`
                      : "✓ DOCUMENT DETECTED")
                  : "📷 ALIGN DOCUMENT IN FRAME"}
              </div>
            )}

            {/* Auto-capture progress ring */}
            {docDetected && autoCapture && stableCount>0 && (
              <div style={{
                position:"absolute",bottom:100,left:"50%",transform:"translateX(-50%)",
                width:56,height:56
              }}>
                <svg viewBox="0 0 56 56" style={{transform:"rotate(-90deg)"}}>
                  <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="4"/>
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#22c55e" strokeWidth="4"
                    strokeDasharray={`${2*Math.PI*24}`}
                    strokeDashoffset={`${2*Math.PI*24*(1-stableCount/5)}`}
                    style={{transition:"stroke-dashoffset 0.2s"}}/>
                </svg>
              </div>
            )}

            {camError && (
              <div style={{
                position:"absolute",inset:0,display:"flex",flexDirection:"column",
                alignItems:"center",justifyContent:"center",gap:16,background:"#0a0a0c"
              }}>
                <div style={{fontSize:48}}>📷</div>
                <div style={{color:T.muted,fontSize:14,textAlign:"center",padding:"0 32px"}}>
                  Camera unavailable on this browser.<br/>Upload a photo instead.
                </div>
                <button onClick={()=>fileInputRef.current.click()} style={{
                  padding:"14px 32px",background:T.gold,color:"#000",
                  border:"none",borderRadius:10,fontWeight:800,cursor:"pointer",
                  fontSize:15,letterSpacing:"0.1em"
                }}>📁 UPLOAD PHOTO</button>
              </div>
            )}

            {processing && (
              <div style={{
                position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",
                display:"flex",flexDirection:"column",alignItems:"center",
                justifyContent:"center",gap:14
              }}>
                <div style={{
                  width:44,height:44,border:`3px solid rgba(212,175,55,0.15)`,
                  borderTop:`3px solid ${T.gold}`,borderRadius:"50%",
                  animation:"spin 0.7s linear infinite"
                }}/>
                <div style={{color:T.gold,fontSize:13,letterSpacing:"0.12em",fontWeight:700}}>
                  DETECTING EDGES...
                </div>
              </div>
            )}
          </div>

          {/* Bottom controls */}
          <div style={{
            background:T.card,borderTop:`1px solid ${T.border}`,
            padding:"14px 20px 20px",flexShrink:0
          }}>
            {/* Auto-capture toggle */}
            <div style={{
              display:"flex",alignItems:"center",justifyContent:"space-between",
              marginBottom:14,padding:"8px 12px",
              background:T.surface,borderRadius:10,border:`1px solid ${T.border}`
            }}>
              <div>
                <div style={{color:T.text,fontSize:13,fontWeight:600}}>Auto-Capture</div>
                <div style={{color:T.muted,fontSize:10,marginTop:1}}>Captures when doc is stable ~1s</div>
              </div>
              <div onClick={()=>setAutoCapture(v=>!v)} style={{
                width:46,height:26,borderRadius:13,cursor:"pointer",
                background:autoCapture?"#22c55e":T.border,
                position:"relative",transition:"background 0.2s",flexShrink:0
              }}>
                <div style={{
                  position:"absolute",top:3,
                  left:autoCapture?22:3,
                  width:20,height:20,borderRadius:"50%",background:"#fff",
                  transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"
                }}/>
              </div>
            </div>

            <div style={{display:"flex",gap:10}}>
              {!camError && (
                <button
                  onClick={captureNow}
                  disabled={!ready||processing}
                  style={{
                    flex:2,padding:"16px 0",
                    background:ready&&!processing?T.gold:T.surface,
                    color:ready&&!processing?"#000":T.muted,
                    border:"none",borderRadius:12,fontWeight:800,
                    fontSize:16,cursor:ready&&!processing?"pointer":"not-allowed",
                    letterSpacing:"0.1em",display:"flex",
                    alignItems:"center",justifyContent:"center",gap:8
                  }}>
                  <span style={{fontSize:20}}>📸</span> CAPTURE
                </button>
              )}
              <button onClick={()=>fileInputRef.current.click()} style={{
                flex:1,padding:"16px 0",background:T.surface,
                color:T.text,border:`1px solid ${T.border}`,borderRadius:12,
                fontWeight:600,fontSize:14,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6
              }}>
                <span>📁</span> Upload
              </button>
            </div>

            <button onClick={onClose} style={{
              width:"100%",marginTop:10,padding:"10px",background:"transparent",
              color:T.muted,border:`1px solid ${T.border}`,borderRadius:10,
              fontWeight:600,fontSize:13,cursor:"pointer"
            }}>✕ CANCEL</button>
          </div>
        </>
      )}

      {/* ══ STAGE 2: ADJUST CORNERS ══ */}
      {stage==="adjust" && (
        <>
          {/* Header */}
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"14px 18px",background:T.card,
            borderBottom:`1px solid ${T.border}`,flexShrink:0
          }}>
            <div>
              <div style={{color:T.gold,fontSize:14,fontWeight:700,letterSpacing:"0.12em"}}>
                ✂ ADJUST EDGES
              </div>
              <div style={{color:T.muted,fontSize:10,marginTop:1}}>
                Drag gold handles to fit the document
              </div>
            </div>
            <button onClick={onClose} style={{
              background:"transparent",border:`1px solid ${T.border}`,
              color:T.muted,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12
            }}>✕</button>
          </div>

          {/* Canvas area */}
          <div style={{
            flex:1,overflow:"auto",display:"flex",
            alignItems:"center",justifyContent:"center",
            padding:"10px",background:"#0a0a0c"
          }}>
            <canvas ref={adjustCanv}
              style={{display:"block",maxWidth:"100%",touchAction:"none",borderRadius:4}}
              onMouseDown={onPtrDown} onMouseMove={onPtrMove}
              onMouseUp={onPtrUp} onMouseLeave={onPtrUp}
              onTouchStart={onPtrDown} onTouchMove={onPtrMove} onTouchEnd={onPtrUp}
            />
          </div>

          {/* Corner labels hint */}
          <div style={{
            display:"flex",justifyContent:"center",gap:8,
            padding:"8px 16px",background:T.surface,
            borderTop:`1px solid ${T.border}`,flexShrink:0
          }}>
            <div style={{color:T.muted,fontSize:10,letterSpacing:"0.08em",textAlign:"center"}}>
              ⊕ DRAG THE 4 GOLD HANDLES TO ALIGN DOCUMENT EDGES
            </div>
          </div>

          <div style={{
            padding:"12px 16px 20px",background:T.card,
            borderTop:`1px solid ${T.border}`,flexShrink:0
          }}>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{
                stopCamera();
                setStage("capture");setCorners(null);
                // restart camera
                setReady(false);setCamError(false);
                let active=true;
                (async()=>{
                  try{
                    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:3840},height:{ideal:2160}}});
                    if(!active)return;
                    streamRef.current=stream;
                    if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play();}
                    setReady(true);
                  }catch{setCamError(true);}
                })();
                return ()=>{active=false;};
              }} style={{
                flex:1,padding:"14px 0",background:"transparent",
                color:T.text,border:`1px solid ${T.border}`,borderRadius:10,
                fontWeight:600,fontSize:14,cursor:"pointer"
              }}>↩ RETAKE</button>
              <button onClick={()=>processDocument("document")} disabled={processing} style={{
                flex:2,padding:"14px 0",
                background:processing?T.surface:T.gold,
                color:processing?T.muted:"#000",
                border:"none",borderRadius:10,fontWeight:800,fontSize:15,
                cursor:processing?"not-allowed":"pointer",letterSpacing:"0.08em",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8
              }}>
                {processing
                  ? <><div style={{width:16,height:16,border:"2px solid rgba(0,0,0,0.3)",borderTop:"2px solid #000",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> PROCESSING...</>
                  : "⚡ SCAN DOCUMENT"
                }
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══ STAGE 3: ENHANCE + CONFIRM ══ */}
      {stage==="enhance" && (
        <>
          {/* Header */}
          <div style={{
            display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"14px 18px",background:T.card,
            borderBottom:`1px solid ${T.border}`,flexShrink:0
          }}>
            <div>
              <div style={{color:T.gold,fontSize:14,fontWeight:700,letterSpacing:"0.12em"}}>
                🎨 ENHANCE & CONFIRM
              </div>
              <div style={{color:T.muted,fontSize:10,marginTop:1}}>Choose filter • Confirm scan</div>
            </div>
            <button onClick={onClose} style={{
              background:"transparent",border:`1px solid ${T.border}`,
              color:T.muted,borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:12
            }}>✕</button>
          </div>

          {/* Filter strip */}
          <div style={{
            display:"flex",gap:6,padding:"10px 12px",
            background:"#0a0c12",borderBottom:`1px solid ${T.border}`,
            flexShrink:0,overflowX:"auto",
            WebkitOverflowScrolling:"touch"
          }}>
            {FILTERS.map(f=>(
              <button key={f.id} onClick={()=>reapplyFilter(f.id)} style={{
                flexShrink:0,padding:"8px 14px",borderRadius:10,
                background:filter===f.id?"rgba(212,175,55,0.13)":"transparent",
                border:`1.5px solid ${filter===f.id?T.gold:T.border}`,
                color:filter===f.id?T.gold:T.muted,
                cursor:"pointer",transition:"all 0.15s",
                fontFamily:"'Rajdhani',sans-serif",textAlign:"left"
              }}>
                <div style={{fontSize:13,fontWeight:filter===f.id?700:500}}>{f.icon} {f.label}</div>
                <div style={{fontSize:9,color:T.muted,marginTop:1}}>{f.desc}</div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div style={{
            flex:1,overflow:"auto",background:"#080808",
            display:"flex",alignItems:"center",justifyContent:"center",
            padding:12
          }}>
            {processing ? (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                <div style={{width:44,height:44,border:`3px solid rgba(212,175,55,0.15)`,
                  borderTop:`3px solid ${T.gold}`,borderRadius:"50%",
                  animation:"spin 0.7s linear infinite"}}/>
                <div style={{color:T.muted,fontSize:12,letterSpacing:"0.1em"}}>ENHANCING IMAGE...</div>
              </div>
            ) : finalImage && (
              <img src={finalImage} alt="Scanned document"
                style={{maxWidth:"100%",maxHeight:"100%",borderRadius:4,
                  boxShadow:"0 0 0 1px rgba(212,175,55,0.2), 0 16px 48px rgba(0,0,0,0.9)"}}/>
            )}
          </div>

          {/* Quality info bar */}
          {!processing && finalImage && (
            <div style={{
              padding:"7px 16px",background:T.surface,
              borderTop:`1px solid ${T.border}`,flexShrink:0,
              display:"flex",justifyContent:"space-between",alignItems:"center"
            }}>
              <span style={{color:T.muted,fontSize:10}}>
                📐 {outW}×{outH} &nbsp;·&nbsp; {mpx}MP
              </span>
              <span style={{
                background:"rgba(34,197,94,0.1)",color:"#22c55e",
                fontSize:10,padding:"3px 10px",borderRadius:99,fontWeight:700
              }}>✓ READY TO SUBMIT</span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{
            padding:"12px 16px 20px",background:T.card,
            borderTop:`1px solid ${T.border}`,flexShrink:0
          }}>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setStage("adjust");setFinalImage(null);}} style={{
                flex:1,padding:"14px 0",background:"transparent",
                color:T.text,border:`1px solid ${T.border}`,borderRadius:10,
                fontWeight:600,fontSize:14,cursor:"pointer"
              }}>← RE-ADJUST</button>
              <button
                disabled={processing||!finalImage}
                onClick={()=>onUse(finalImage)}
                style={{
                  flex:2,padding:"14px 0",
                  background:!processing&&finalImage?T.gold:T.surface,
                  color:!processing&&finalImage?"#000":T.muted,
                  border:"none",borderRadius:10,fontWeight:800,fontSize:15,
                  cursor:!processing&&finalImage?"pointer":"not-allowed",
                  letterSpacing:"0.08em"
                }}>✓ USE THIS SCAN</button>
            </div>
          </div>
        </>
      )}

      {/* Hidden elements */}
      <canvas ref={captureCanv} style={{display:"none"}}/>
      <canvas ref={outputCanv}  style={{display:"none"}}/>
      <input ref={fileInputRef} type="file" accept="image/*"
        capture="environment" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

// ─── SUBMIT TICKET ────────────────────────────────────────────────────────────
function SubmitTicket({ phone, onComplete, editTicket }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError,  setSubmitError]  = useState("");

  const today = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
  })();

  const [form, setForm] = useState(() => editTicket ? {
    client:         editTicket["Client"]       || "",
    fieldTicket:    editTicket["Field Ticket #"]|| "",
    dispatch:       editTicket["Dispatch #"]   || "",
    unit:           editTicket["Unit #"]       || "",
    driver:         editTicket["Driver"]       || "",
    workDate:       editTicket["Service Date"] || today,
    wellLease:      editTicket["Well/Lease"]   || "",
    notes:          editTicket["Notes"]        || "",
    fieldTicketImage: "",
    startTime:      editTicket["Start Time"]   || "",
    endTime:        editTicket["End Time"]     || "",
    hourlyRate:     editTicket["Hourly Rate"]  || "",
  } : {
    client:"", fieldTicket:"", dispatch:"", unit:"",
    driver:"", workDate: today, wellLease:"", notes:"", fieldTicketImage:"",
    startTime:"", endTime:"", hourlyRate:"",
  });

  const [loads, setLoads] = useState([{
    id:1, geminiRef:"", loadTicket:"", fluid:"Fresh Water",
    bbls:"", manifestOps:{ washOut:false, unload:false }, verificationImage:""
  }]);

  const [submissionId] = useState(editTicket ? editTicket["Submission ID"] : null);
  const [scanTarget,  setScanTarget]  = useState(null);
  const [scanOpen,    setScanOpen]    = useState(false);
  const [hasSignature,setHasSignature]= useState(false);
  const sigRef = useRef(null);
  const drawing = useRef(false);
  const lastPt  = useRef({ x:0, y:0 });

  const isExxon = form.client === "Exxon";

  function update(k, v) { setForm(p => ({ ...p, [k]: v })); }
  function updateLoad(i, k, v) { setLoads(p => { const c=[...p]; c[i][k]=v; return c; }); }
  function addLoad() {
    setLoads(p => [...p, {
      id: p.length+1, geminiRef:"", loadTicket:"",
      fluid:"Fresh Water", bbls:"", manifestOps:{washOut:false,unload:false}, verificationImage:""
    }]);
  }
  function deleteLoad(i) { setLoads(p => p.filter((_,idx)=>idx!==i)); }
  function toggleOp(i, op) {
    setLoads(p => { const c=[...p]; c[i].manifestOps[op]=!c[i].manifestOps[op]; return c; });
  }

  const totalBBLS = useMemo(() =>
    loads.reduce((s,l) => { const n=parseFloat(l.bbls); return s+(isNaN(n)?0:n); }, 0)
  , [loads]);

  function nonEmpty(v) { return String(v??""  ).trim().length > 0; }
  function loadOk(l) {
    const base = (!isExxon || nonEmpty(l.geminiRef)) && nonEmpty(l.loadTicket) &&
      nonEmpty(l.bbls) && !isNaN(parseFloat(l.bbls));
    return l.fluid === "Manifest" ? base && (l.manifestOps.washOut || l.manifestOps.unload) : base;
  }

  const checks = useMemo(() => [
    { key:"client",           ok: nonEmpty(form.client) },
    { key:"fieldTicket",      ok: nonEmpty(form.fieldTicket) },
    { key:"dispatch",         ok: nonEmpty(form.dispatch) },
    { key:"unit",             ok: nonEmpty(form.unit) },
    { key:"driver",           ok: nonEmpty(form.driver) },
    { key:"workDate",         ok: nonEmpty(form.workDate) },
    { key:"wellLease",        ok: nonEmpty(form.wellLease) },
    { key:"fieldTicketImage", ok: nonEmpty(form.fieldTicketImage) },
    { key:"signature",        ok: hasSignature },
    ...loads.map((l,i) => ({ key:`load_${i}`, ok: loadOk(l) }))
  ], [form, loads, hasSignature]);

  const progress  = useMemo(() => Math.round(checks.filter(c=>c.ok).length / checks.length * 100), [checks]);
  const isComplete= useMemo(() => checks.every(c=>c.ok), [checks]);

  const dispatchLabel = {
    "Exxon":"GEMINI DISPATCH #", "Oxy":"IRONSIGHT JOB #",
    "Western Midstream":"IRONSIGHT JOB #"
  }[form.client] || "DISPATCH #";

  // Signature canvas
  function pt(e, canvas) {
    const r = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x:(cx-r.left)*(canvas.width/r.width), y:(cy-r.top)*(canvas.height/r.height) };
  }
  function startDraw(e) {
    if (e.type==="touchstart") e.preventDefault();
    const c=sigRef.current, ctx=c.getContext("2d");
    drawing.current=true;
    const p=pt(e,c); lastPt.current=p;
    ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle="#000";
    ctx.beginPath(); ctx.moveTo(p.x,p.y);
  }
  function draw(e) {
    if (!drawing.current) return;
    if (e.type==="touchmove") e.preventDefault();
    const c=sigRef.current, ctx=c.getContext("2d"), p=pt(e,c);
    ctx.lineTo(p.x,p.y); ctx.stroke(); lastPt.current=p; setHasSignature(true);
  }
  function endDraw() { drawing.current=false; }
  function clearSig() {
    const c=sigRef.current; c.getContext("2d").clearRect(0,0,c.width,c.height);
    setHasSignature(false);
  }

  async function handleSubmit() {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true); setSubmitError("");
    const payload = {
      submissionId, phone, ...form, loads, totalBBLS,
      signature: sigRef.current.toDataURL("image/png")
    };
    try {
      await fetch(API_URL, {
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body: JSON.stringify(payload)
      });
      onComplete();
    } catch {
      try {
        const q = JSON.parse(localStorage.getItem("offlineTickets")||"[]");
        q.push(payload);
        localStorage.setItem("offlineTickets", JSON.stringify(q));
        alert("No internet — ticket saved offline and will sync automatically.");
        onComplete();
      } catch { setSubmitError("Submission failed. Please try again."); }
    } finally { setIsSubmitting(false); }
  }

  // offline sync
  useEffect(() => {
    async function syncOffline() {
      const q = JSON.parse(localStorage.getItem("offlineTickets")||"[]");
      if (!q.length) return;
      for (const t of q) {
        try {
          await fetch(API_URL, { method:"POST", headers:{"Content-Type":"text/plain;charset=utf-8"}, body:JSON.stringify(t) });
        } catch { return; }
      }
      localStorage.removeItem("offlineTickets");
    }
    window.addEventListener("online", syncOffline);
    syncOffline();
    return () => window.removeEventListener("online", syncOffline);
  }, []);

  const sectionStyle = {
    background: T.surface, borderRadius: 10, padding:"16px",
    border:`1px solid ${T.border}`, marginBottom: 12
  };
  const sectionTitle = {
    color: T.gold, fontFamily:"'Rajdhani',sans-serif",
    fontSize: 13, fontWeight: 700, letterSpacing:"0.15em", marginBottom: 14
  };

  return (
    <PageShell maxW={520}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ color: T.gold, fontFamily:"'Rajdhani',sans-serif",
            fontSize: 20, fontWeight: 700, letterSpacing:"0.12em" }}>
            {editTicket ? "EDIT & RESUBMIT" : "NEW FIELD TICKET"}
          </div>
          <div style={{ color: T.muted, fontSize: 11 }}>
            {editTicket ? `Editing ${submissionId}` : "Complete all required fields"}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 20, position:"sticky", top:0, zIndex:10,
        background: T.card, paddingTop: 4, paddingBottom: 8 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          fontSize: 11, color: T.muted, marginBottom: 6 }}>
          <span>FORM COMPLETION</span>
          <span style={{ color: progress===100 ? T.success : T.gold, fontWeight: 700 }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: 4, background: T.surface, borderRadius: 99 }}>
          <div style={{
            height:"100%", borderRadius: 99,
            background: progress===100 ? T.success : T.gold,
            width:`${progress}%`, transition:"width 0.3s ease"
          }}/>
        </div>
      </div>

      {/* ── JOB INFO ── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>📋 JOB INFORMATION</div>

        <Label text="Client Organization" required/>
        <Select value={form.client} onChange={e=>update("client",e.target.value)}>
          <option value="">Select client…</option>
          {["Exxon","Oxy","Western Midstream","Chevron","Other"].map(c=>(
            <option key={c}>{c}</option>
          ))}
        </Select>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Field Ticket #" required/>
            <Input value={form.fieldTicket} onChange={e=>update("fieldTicket",e.target.value)}/>
          </div>
          <div>
            <Label text={dispatchLabel} required/>
            <Input value={form.dispatch} onChange={e=>update("dispatch",e.target.value)}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Unit / Truck #" required/>
            <Input value={form.unit} onChange={e=>update("unit",e.target.value)}/>
          </div>
          <div>
            <Label text="Driver Name" required/>
            <Input value={form.driver} onChange={e=>update("driver",e.target.value)}/>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
          <div>
            <Label text="Work Date" required/>
            <Input type="date" value={form.workDate} onChange={e=>update("workDate",e.target.value)}/>
          </div>
          <div>
            <Label text="Well / Lease" required/>
            <Input value={form.wellLease} onChange={e=>update("wellLease",e.target.value)}/>
          </div>
        </div>

        <Label text="Notes / Description"/>
        <Textarea placeholder="Add job specifics…" value={form.notes}
          onChange={e=>update("notes",e.target.value)}/>

        {/* ── TIME & HOURS ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 4 }}>
          <div>
            <Label text="Start Time"/>
            <Input type="time" value={form.startTime} onChange={e=>update("startTime",e.target.value)}/>
          </div>
          <div>
            <Label text="End Time"/>
            <Input type="time" value={form.endTime} onChange={e=>update("endTime",e.target.value)}/>
          </div>
        </div>

        <Label text="Hourly Rate ($)"/>
        <Input
          type="number"
          placeholder="e.g. 85"
          value={form.hourlyRate}
          onChange={e=>update("hourlyRate",e.target.value)}
        />

        {/* Live total hours display */}
        {form.startTime && form.endTime && (() => {
          const [sh,sm] = form.startTime.split(":").map(Number);
          const [eh,em] = form.endTime.split(":").map(Number);
          let mins = (eh*60+em) - (sh*60+sm);
          if (mins < 0) mins += 1440;
          const hrs = (mins/60).toFixed(2);
          const total = form.hourlyRate ? (parseFloat(hrs) * parseFloat(form.hourlyRate)).toFixed(2) : null;
          return (
            <div style={{
              marginTop: 10, padding:"10px 14px", background: "rgba(212,175,55,0.08)",
              border:"1px solid rgba(212,175,55,0.25)", borderRadius: 8,
              display:"flex", justifyContent:"space-between", alignItems:"center"
            }}>
              <div>
                <div style={{ color: T.muted, fontSize: 10 }}>TOTAL HOURS</div>
                <div style={{ color: T.gold, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:18 }}>{hrs} hrs</div>
              </div>
              {total && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ color: T.muted, fontSize: 10 }}>HOURS TOTAL</div>
                  <div style={{ color: T.success, fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:18 }}>${total}</div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── FIELD TICKET PHOTO ── */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>📄 FIELD TICKET PHOTO <span style={{color:T.danger}}>✱</span></div>
        <div onClick={() => { setScanTarget({type:"field"}); setScanOpen(true); }}
          style={{
            border:`1px dashed ${form.fieldTicketImage ? T.goldDim : T.border}`,
            borderRadius: 8, padding: 20, cursor:"pointer", textAlign:"center",
            background: T.bg, transition:"border-color 0.2s"
          }}>
          {form.fieldTicketImage
            ? <img src={form.fieldTicketImage} style={{ width:"100%", borderRadius: 6 }} alt=""/>
            : <div style={{ color: T.muted, fontSize: 13 }}>📄 Tap to scan or upload ticket</div>
          }
        </div>
        {form.fieldTicketImage && (
          <button onClick={()=>update("fieldTicketImage","")} style={{
            marginTop: 8, background:"transparent", border:"none",
            color: T.danger, fontSize: 12, cursor:"pointer"
          }}>✕ Remove photo</button>
        )}
      </div>

      {/* ── LOAD MANIFEST ── */}
      <div style={{ ...sectionStyle }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
          <div style={sectionTitle}>🚛 LOAD MANIFEST</div>
          <div style={{
            background:`rgba(212,175,55,0.1)`, border:`1px solid ${T.goldDim}`,
            borderRadius: 8, padding:"4px 12px", color: T.gold,
            fontFamily:"'Space Mono',monospace", fontSize: 13, fontWeight: 700
          }}>
            {totalBBLS.toFixed(2)} BBL
          </div>
        </div>

        {loads.map((load, idx) => (
          <div key={load.id} style={{
            background: T.bg, borderRadius: 8, padding: 14,
            border:`1px solid ${T.border}`, marginBottom: 10,
            borderLeft:`3px solid ${T.gold}`
          }}>
            <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 12 }}>
              <span style={{
                background: T.gold, color:"#000", padding:"2px 8px",
                borderRadius: 4, fontWeight: 800, fontSize: 11, fontFamily:"'Rajdhani',sans-serif"
              }}>LOAD {String(idx+1).padStart(2,"0")}</span>
              {loads.length > 1 && (
                <button onClick={()=>deleteLoad(idx)} style={{
                  marginLeft:"auto", background:"transparent",
                  border:`1px solid ${T.border}`, color: T.danger,
                  borderRadius: 6, padding:"2px 8px", cursor:"pointer", fontSize: 12
                }}>✕</button>
              )}
            </div>

            {isExxon && (
              <>
                <Label text="Gemini Dispatch Ref #" required/>
                <Input value={load.geminiRef} onChange={e=>updateLoad(idx,"geminiRef",e.target.value)}/>
              </>
            )}

            <Label text="Load Ticket Number" required/>
            <Input value={load.loadTicket} onChange={e=>updateLoad(idx,"loadTicket",e.target.value)}/>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
              <div>
                <Label text="Fluid Type"/>
                <Select value={load.fluid} onChange={e=>updateLoad(idx,"fluid",e.target.value)}>
                  {["Fresh Water","Brine Water","Disposal Water","Manifest"].map(f=>(
                    <option key={f}>{f}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label text="BBLs" required/>
                <Input type="number" value={load.bbls}
                  onChange={e=>updateLoad(idx,"bbls",e.target.value)}/>
              </div>
            </div>

            {/* Quick-fill buttons */}
            <div style={{ display:"flex", flexWrap:"wrap", gap: 6, marginTop: 8 }}>
              {[90,100,120,130,150,200].map(q=>(
                <button key={q} onClick={()=>updateLoad(idx,"bbls",String(q))}
                  style={{
                    padding:"5px 10px", borderRadius: 6, fontSize: 12, cursor:"pointer",
                    background: String(load.bbls)===String(q)
                      ? `rgba(212,175,55,0.2)` : T.surface,
                    border:`1px solid ${String(load.bbls)===String(q) ? T.gold : T.border}`,
                    color: String(load.bbls)===String(q) ? T.gold : T.muted,
                    transition:"all 0.15s"
                  }}>{q}</button>
              ))}
            </div>

            {/* Verification image */}
            <Label text="Verification Image"/>
            <div onClick={()=>{ setScanTarget({type:"load",index:idx}); setScanOpen(true); }}
              style={{
                border:`1px dashed ${load.verificationImage ? T.goldDim : T.border}`,
                borderRadius: 8, padding: load.verificationImage ? 0 : 14,
                cursor:"pointer", textAlign:"center", background: T.card, overflow:"hidden"
              }}>
              {load.verificationImage
                ? <img src={load.verificationImage} style={{ width:"100%", display:"block" }} alt=""/>
                : <div style={{ color: T.muted, fontSize: 12 }}>🧾 Scan load ticket</div>
              }
            </div>

            {/* Manifest ops */}
            {load.fluid === "Manifest" && (
              <div style={{
                marginTop: 10, border:`1px solid ${T.border}`, borderRadius: 8, padding: 12
              }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  color: T.muted, fontSize: 10, marginBottom: 10 }}>
                  <span>MANIFEST OPERATIONS</span>
                  <span style={{ color: T.danger }}>REQUIRED SELECTION</span>
                </div>
                <div style={{ display:"flex", gap: 8 }}>
                  {[["washOut","WASH OUT"],["unload","UNLOAD"]].map(([op,label])=>(
                    <button key={op} onClick={()=>toggleOp(idx,op)} style={{
                      flex:1, padding:"9px 0", borderRadius: 8, fontWeight: 700,
                      fontSize: 12, cursor:"pointer", letterSpacing:"0.05em",
                      border:`1px solid ${load.manifestOps[op] ? T.gold : T.border}`,
                      background: load.manifestOps[op] ? `rgba(212,175,55,0.12)` : "transparent",
                      color: load.manifestOps[op] ? T.gold : T.muted,
                      transition:"all 0.15s"
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <button onClick={addLoad} style={{
          width:"100%", padding: 12, border:`1px dashed ${T.border}`,
          borderRadius: 8, cursor:"pointer", textAlign:"center",
          background:"transparent", color: T.muted, fontSize: 13,
          transition:"all 0.15s"
        }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=T.borderHi; e.currentTarget.style.color=T.text;}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.muted;}}
        >+ ADD ADDITIONAL LOAD</button>
      </div>

      {/* ── SIGNATURE ── */}
      <div style={sectionStyle}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 10 }}>
          <div style={sectionTitle}>✍ OPERATOR SIGNATURE <span style={{color:T.danger}}>✱</span></div>
          {hasSignature && (
            <button onClick={clearSig} style={{
              background:"transparent", border:"none",
              color: T.danger, fontSize: 12, cursor:"pointer"
            }}>✕ Clear</button>
          )}
        </div>
        <div style={{ borderRadius: 8, overflow:"hidden", border:`1px solid ${T.border}` }}>
          <canvas ref={sigRef} width={900} height={280}
            style={{ width:"100%", height: 140, background:"#fff", display:"block", touchAction:"none" }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
        </div>
        {!hasSignature && (
          <div style={{ color: T.muted, fontSize: 11, textAlign:"center", marginTop: 6 }}>
            Sign above with your finger or mouse
          </div>
        )}
      </div>

      {/* ── VOLUME SUMMARY ── */}
      <div style={{
        ...sectionStyle, display:"flex", justifyContent:"space-between", alignItems:"center"
      }}>
        <div style={{ color: T.muted, fontSize: 12 }}>
          <div>TOTAL LOADS</div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 18, marginTop: 2 }}>{loads.length}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color: T.muted, fontSize: 12 }}>TOTAL VOLUME</div>
          <div style={{
            color: T.gold, fontFamily:"'Space Mono',monospace",
            fontSize: 28, fontWeight: 700, marginTop: 2
          }}>{totalBBLS.toFixed(2)} <span style={{ fontSize: 14 }}>BBL</span></div>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      {submitError && (
        <div style={{ color: T.danger, fontSize: 12, textAlign:"center", marginBottom: 10 }}>
          ⚠ {submitError}
        </div>
      )}

      <GoldBtn
        disabled={!isComplete}
        loading={isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? "SUBMITTING…" : isComplete ? "✓ SUBMIT FINAL TICKET" : `COMPLETE FORM (${progress}%)`}
      </GoldBtn>

      <ScannerModal
        open={scanOpen}
        onClose={()=>setScanOpen(false)}
        onUse={img => {
          if (scanTarget?.type === "field") update("fieldTicketImage", img);
          if (scanTarget?.type === "load") {
            setLoads(p=>{ const c=[...p]; c[scanTarget.index].verificationImage=img; return c; });
          }
          setScanOpen(false); setScanTarget(null);
        }}
      />
    </PageShell>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  injectGlobalStyles();

  const [phone,      setPhone]      = useState(() => localStorage.getItem("bd_phone"));
  const [page,       setPage]       = useState(() => localStorage.getItem("bd_phone") ? "dashboard" : "login");
  const [editTicket, setEditTicket] = useState(null);

  function login(p)   { localStorage.setItem("bd_phone",p); setPhone(p); setPage("dashboard"); }
  function logout()   { localStorage.removeItem("bd_phone"); setPhone(null); setPage("login"); }

  if (!phone || page === "login")
    return <Login onLogin={login}/>;
  if (page === "dashboard")
    return <Dashboard phone={phone} onLogout={logout}
      onStartTicket={()=>{ setEditTicket(null); setPage("submit"); }}
      onOpenQueue={()=>setPage("queue")}/>;
  if (page === "queue")
    return <Queue phone={phone} onBack={()=>setPage("dashboard")}
      onEdit={t=>{ setEditTicket(t); setPage("submit"); }}/>;
  if (page === "submit")
    return <SubmitTicket phone={phone} editTicket={editTicket}
      onComplete={()=>{ setEditTicket(null); setPage("success"); }}/>;
  if (page === "success")
    return <TicketSuccess onBack={()=>setPage("dashboard")}/>;

  return null;
}
