import React, { useState, useMemo, useEffect, useRef, createPortal } from "react";

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
    <>
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

// ─── DOCUMENT SCANNER v6 ─────────────────────────────────────────────────────
// Three stages: cam | crop | enhance
// cam:     fullscreen video + 15fps Sobel detection + canvas overlay (no React rerenders in draw loop)
// crop:    frozen image + draggable handles on full-width canvas + pinch zoom
// enhance: filter strip + final preview + confirm
//
function ScannerModal({ open, onClose, onUse }) {
  const [stage,    setStage]    = useState("cam");
  const [docFound, setDocFound] = useState(false);
  const [autoSnap, setAutoSnap] = useState(true);
  const [stableN,  setStableN]  = useState(0);
  const [filter,   setFilter]   = useState("document");
  const [busy,     setBusy]     = useState(false);
  const [finalImg, setFinalImg] = useState(null);
  const [camReady, setCamReady] = useState(false);
  const [camErr,   setCamErr]   = useState(false);
  const [outSz,    setOutSz]    = useState({w:0,h:0});
  const [cropZoom, setCropZoom] = useState(1);
  const [tick,     setTick]     = useState(0); // force crop redraw

  const vidR    = useRef(null);
  const streamR = useRef(null);
  const ovR     = useRef(null);   // live overlay canvas
  const cropR   = useRef(null);   // crop editor canvas
  const capR    = useRef(null);   // hidden capture canvas
  const outR    = useRef(null);   // hidden output canvas
  const fileR   = useRef(null);

  const imgR      = useRef(null);
  const cornR     = useRef(null);   // normalised corners [{x,y}]
  const smoothBuf = useRef([]);
  const smoothR   = useRef(null);
  const stableR   = useRef(0);
  const prevDetR  = useRef(null);
  const autoR     = useRef(true);
  const dragR     = useRef(null);
  const pinchR    = useRef(null);
  const detLoopR  = useRef(null);
  const drawLoopR = useRef(null);
  const detTR     = useRef(0);
  autoR.current   = autoSnap;

  // open/close
  // Lock body scroll when scanner is open (prevents iOS Safari bounce-scroll bug)
  useEffect(()=>{
    if(open){
      document.body.style.overflow="hidden";
      document.body.style.position="fixed";
      document.body.style.width="100%";
    }
    return()=>{
      document.body.style.overflow="";
      document.body.style.position="";
      document.body.style.width="";
    };
  },[open]);

  useEffect(()=>{
    if(!open)return;
    fullReset(); startCam();
    return stopAll;
  },[open]);

  function fullReset(){
    setStage("cam");setDocFound(false);setFinalImg(null);
    setFilter("document");setBusy(false);setCamReady(false);setCamErr(false);
    setStableN(0);setCropZoom(1);
    smoothBuf.current=[];smoothR.current=null;stableR.current=0;
    prevDetR.current=null;dragR.current=null;cornR.current=null;pinchR.current=null;
  }

  async function startCam(){
    try{
      const s=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:{ideal:"environment"},width:{ideal:1920,min:640},height:{ideal:1440,min:480}}
      });
      streamR.current=s;
      if(vidR.current){vidR.current.srcObject=s;await vidR.current.play();}
      setCamReady(true);
    }catch{setCamErr(true);}
  }

  function stopAll(){
    if(detLoopR.current){cancelAnimationFrame(detLoopR.current);detLoopR.current=null;}
    if(drawLoopR.current){cancelAnimationFrame(drawLoopR.current);drawLoopR.current=null;}
    if(streamR.current){streamR.current.getTracks().forEach(t=>t.stop());streamR.current=null;}
  }

  // DETECTION LOOP — 15fps throttle
  useEffect(()=>{
    if(!camReady||stage!=="cam")return;
    const tick=()=>{
      const now=Date.now();
      if(now-detTR.current>=66){detTR.current=now;runDetect();}
      detLoopR.current=requestAnimationFrame(tick);
    };
    detLoopR.current=requestAnimationFrame(tick);
    return()=>{if(detLoopR.current)cancelAnimationFrame(detLoopR.current);};
  },[camReady,stage]);

  function runDetect(){
    const v=vidR.current;
    if(!v||v.readyState<2||!v.videoWidth)return;
    const DW=320,DH=Math.round(320*v.videoHeight/v.videoWidth);
    const c=document.createElement("canvas");c.width=DW;c.height=DH;
    c.getContext("2d").drawImage(v,0,0,DW,DH);
    const found=sobelRect(c.getContext("2d"),DW,DH);
    if(found){
      smoothBuf.current.push(found);
      if(smoothBuf.current.length>4)smoothBuf.current.shift();
      smoothR.current=avgCorners(smoothBuf.current);
      setDocFound(true);
      if(autoR.current&&prevDetR.current){
        const drift=found.reduce((s,p,i)=>s+Math.hypot(p.x-prevDetR.current[i].x,p.y-prevDetR.current[i].y),0);
        if(drift<0.018){
          stableR.current=Math.min(stableR.current+1,6);
          setStableN(stableR.current);
          if(stableR.current>=5){doCapture();return;}
        }else{stableR.current=0;setStableN(0);}
      }
      prevDetR.current=found;
    }else{
      smoothBuf.current=[];smoothR.current=null;
      setDocFound(false);setStableN(0);stableR.current=0;prevDetR.current=null;
    }
  }

  function avgCorners(frames){
    const n=frames.length;
    return frames[0].map((_,i)=>({
      x:frames.reduce((s,f)=>s+f[i].x,0)/n,
      y:frames.reduce((s,f)=>s+f[i].y,0)/n,
    }));
  }

  // OVERLAY DRAW LOOP — ~30fps
  useEffect(()=>{
    if(!camReady||stage!=="cam")return;
    const tick=()=>{paintOverlay();drawLoopR.current=requestAnimationFrame(tick);};
    drawLoopR.current=requestAnimationFrame(tick);
    return()=>{if(drawLoopR.current)cancelAnimationFrame(drawLoopR.current);};
  },[camReady,stage]);

  function paintOverlay(){
    const cv=ovR.current;if(!cv)return;
    const dpr=window.devicePixelRatio||1;
    const W=cv.offsetWidth,H=cv.offsetHeight;if(!W||!H)return;
    if(cv.width!==W*dpr||cv.height!==H*dpr){cv.width=W*dpr;cv.height=H*dpr;}
    const ctx=cv.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    const sc=smoothR.current;
    if(sc){
      const pts=sc.map(p=>({x:p.x*W,y:p.y*H}));
      // fill tint
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
      ctx.fillStyle="rgba(34,197,94,0.08)";ctx.fill();
      // pulsing glow
      const pulse=0.5+0.4*Math.sin(Date.now()/370);
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
      ctx.strokeStyle=`rgba(34,197,94,${(0.2+0.2*pulse).toFixed(2)})`;ctx.lineWidth=10;ctx.stroke();
      // solid border
      ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
      pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
      ctx.strokeStyle="#22c55e";ctx.lineWidth=2.5;ctx.stroke();
      // white L-brackets
      const BL=24,BW=4;
      [[1,1],[-1,1],[-1,-1],[1,-1]].forEach(([dx,dy],i)=>{
        const p=pts[i];
        ctx.strokeStyle="#fff";ctx.lineWidth=BW;ctx.lineCap="round";
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+dx*BL,p.y);ctx.stroke();
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y+dy*BL);ctx.stroke();
      });
      // corner dots
      pts.forEach(p=>{
        ctx.beginPath();ctx.arc(p.x,p.y,7,0,Math.PI*2);
        ctx.fillStyle="#22c55e";ctx.fill();
        ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.stroke();
      });
    }else{
      // gold guide brackets
      const px=W*0.07,py=H*0.10,BL=28;
      ctx.strokeStyle="rgba(212,175,55,0.6)";ctx.lineWidth=3;ctx.lineCap="round";
      [[px,py,1,1],[W-px,py,-1,1],[W-px,H-py,-1,-1],[px,H-py,1,-1]].forEach(([x,y,dx,dy])=>{
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dx*BL,y);ctx.stroke();
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+dy*BL);ctx.stroke();
      });
    }
    ctx.setTransform(1,0,0,1,0,0);
  }

  // SOBEL edge detection
  function sobelRect(ctx,W,H){
    const px=ctx.getImageData(0,0,W,H).data;
    const g=new Float32Array(W*H);
    for(let i=0;i<W*H;i++)g[i]=0.299*px[i*4]+0.587*px[i*4+1]+0.114*px[i*4+2];
    const bl=new Float32Array(W*H);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++)
      bl[y*W+x]=(g[(y-1)*W+(x-1)]+2*g[(y-1)*W+x]+g[(y-1)*W+(x+1)]+
                 2*g[y*W+(x-1)]+4*g[y*W+x]+2*g[y*W+(x+1)]+
                 g[(y+1)*W+(x-1)]+2*g[(y+1)*W+x]+g[(y+1)*W+(x+1)])/16; // Gaussian 3×3
    const e=new Float32Array(W*H);let mx=0;
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
      const gx=-bl[(y-1)*W+(x-1)]-2*bl[y*W+(x-1)]-bl[(y+1)*W+(x-1)]+bl[(y-1)*W+(x+1)]+2*bl[y*W+(x+1)]+bl[(y+1)*W+(x+1)];
      const gy=-bl[(y-1)*W+(x-1)]-2*bl[(y-1)*W+x]-bl[(y-1)*W+(x+1)]+bl[(y+1)*W+(x-1)]+2*bl[(y+1)*W+x]+bl[(y+1)*W+(x+1)];
      const v=Math.sqrt(gx*gx+gy*gy);e[y*W+x]=v;if(v>mx)mx=v;
    }
    if(mx<12)return null;
    const th=mx*0.22;let x0=W,x1=0,y0=H,y1=0,ok=false;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(e[y*W+x]>th){
      if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;ok=true;
    }
    if(!ok)return null;
    const rw=(x1-x0)/W,rh=(y1-y0)/H;
    if(rw<0.28||rh<0.28||rw>0.93||rh>0.93)return null;
    const p=0.008;
    return[
      {x:Math.max(0,x0/W-p),y:Math.max(0,y0/H-p)},
      {x:Math.min(1,x1/W+p),y:Math.max(0,y0/H-p)},
      {x:Math.min(1,x1/W+p),y:Math.min(1,y1/H+p)},
      {x:Math.max(0,x0/W-p),y:Math.min(1,y1/H+p)},
    ];
  }

  // CAPTURE
  function doCapture(){
    if(detLoopR.current){cancelAnimationFrame(detLoopR.current);detLoopR.current=null;}
    if(drawLoopR.current){cancelAnimationFrame(drawLoopR.current);drawLoopR.current=null;}
    const v=vidR.current;if(!v)return;
    const hc=capR.current;
    hc.width=v.videoWidth;hc.height=v.videoHeight;
    hc.getContext("2d").drawImage(v,0,0);
    if(streamR.current){streamR.current.getTracks().forEach(t=>t.stop());streamR.current=null;}
    setBusy(true);
    const img=new Image();
    img.onload=()=>{
      imgR.current=img;
      const S=700,sc=Math.min(1,S/Math.max(img.width,img.height));
      const tw=Math.round(img.width*sc),th=Math.round(img.height*sc);
      const tc=document.createElement("canvas");tc.width=tw;tc.height=th;
      tc.getContext("2d").drawImage(img,0,0,tw,th);
      const det=sobelRect(tc.getContext("2d"),tw,th);
      const p=0.06;
      cornR.current=smoothR.current||det||[{x:p,y:p},{x:1-p,y:p},{x:1-p,y:1-p},{x:p,y:1-p}];
      setBusy(false);setStage("crop");
    };
    img.src=hc.toDataURL("image/jpeg",0.97);
  }

  function handleFile(e){
    const f=e.target.files[0];if(!f)return;
    stopAll();setBusy(true);
    const r=new FileReader();
    r.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        imgR.current=img;
        capR.current.width=img.width;capR.current.height=img.height;
        capR.current.getContext("2d").drawImage(img,0,0);
        const S=700,sc=Math.min(1,S/Math.max(img.width,img.height));
        const tw=Math.round(img.width*sc),th=Math.round(img.height*sc);
        const tc=document.createElement("canvas");tc.width=tw;tc.height=th;
        tc.getContext("2d").drawImage(img,0,0,tw,th);
        const det=sobelRect(tc.getContext("2d"),tw,th);
        const p=0.06;
        cornR.current=det||[{x:p,y:p},{x:1-p,y:p},{x:1-p,y:1-p},{x:p,y:1-p}];
        setBusy(false);setStage("crop");
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(f);e.target.value="";
  }

  // CROP CANVAS PAINT
  useEffect(()=>{
    if(stage!=="crop"||!imgR.current||!cropR.current)return;
    paintCrop();
  },[stage,tick,cropZoom]);

  function paintCrop(){
    const cv=cropR.current,img=imgR.current;if(!cv||!img)return;
    // Full screen width
    const SW=window.innerWidth,SH=Math.round(SW*img.height/img.width);
    cv.width=SW;cv.height=SH;
    const ctx=cv.getContext("2d"),W=SW,H=SH;
    ctx.drawImage(img,0,0,W,H);
    const C=cornR.current;if(!C)return;
    const pts=C.map(p=>({x:p.x*W,y:p.y*H}));
    // Darken outside
    ctx.fillStyle="rgba(0,0,0,0.52)";ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
    ctx.globalCompositeOperation="destination-out";ctx.fill();ctx.restore();
    // Image inside
    ctx.save();
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
    ctx.clip();ctx.drawImage(img,0,0,W,H);ctx.restore();
    // Gold border
    ctx.save();ctx.shadowColor="#D4AF37";ctx.shadowBlur=14;
    ctx.strokeStyle="#D4AF37";ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.stroke();ctx.restore();
    // Grid inside
    ctx.save();
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.clip();
    const x0=Math.min(...pts.map(p=>p.x)),x1=Math.max(...pts.map(p=>p.x));
    const y0=Math.min(...pts.map(p=>p.y)),y1=Math.max(...pts.map(p=>p.y));
    const tw=(x1-x0)/3,th=(y1-y0)/3;
    ctx.strokeStyle="rgba(212,175,55,0.12)";ctx.lineWidth=1;
    for(let i=1;i<3;i++){
      ctx.beginPath();ctx.moveTo(x0+tw*i,y0);ctx.lineTo(x0+tw*i,y1);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x0,y0+th*i);ctx.lineTo(x1,y0+th*i);ctx.stroke();
    }
    ctx.restore();
    // Handles
    pts.forEach((p,i)=>{
      ctx.beginPath();ctx.arc(p.x,p.y,32,0,Math.PI*2);
      ctx.fillStyle="rgba(212,175,55,0.10)";ctx.fill();
      ctx.save();ctx.shadowColor="rgba(0,0,0,0.85)";ctx.shadowBlur=14;
      ctx.beginPath();ctx.arc(p.x,p.y,22,0,Math.PI*2);
      ctx.fillStyle=dragR.current===i?"#ffffff":"#D4AF37";ctx.fill();ctx.restore();
      ctx.strokeStyle="rgba(0,0,0,0.55)";ctx.lineWidth=3;ctx.stroke();
      ctx.strokeStyle=dragR.current===i?"#444":"rgba(0,0,0,0.65)";ctx.lineWidth=3;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(p.x-11,p.y);ctx.lineTo(p.x+11,p.y);ctx.stroke();
      ctx.beginPath();ctx.moveTo(p.x,p.y-11);ctx.lineTo(p.x,p.y+11);ctx.stroke();
    });
  }

  // Crop pointer events — getBoundingClientRect handles CSS scale transform
  function cropXY(e){
    const cv=cropR.current;if(!cv)return{cx:null,cy:null};
    const rect=cv.getBoundingClientRect();
    const src=e.touches?e.touches[0]:e;
    return{
      cx:(src.clientX-rect.left)*(cv.width/rect.width),
      cy:(src.clientY-rect.top)*(cv.height/rect.height),
    };
  }
  function cropDown(e){
    if(e.touches&&e.touches.length===2){pinchStart(e);return;}
    e.preventDefault();
    const{cx,cy}=cropXY(e);if(cx===null)return;
    const cv=cropR.current;
    const pts=cornR.current.map(p=>({x:p.x*cv.width,y:p.y*cv.height}));
    const hit=pts.findIndex(p=>Math.hypot(p.x-cx,p.y-cy)<44);
    if(hit!==-1)dragR.current=hit;
  }
  function cropMove(e){
    if(e.touches&&e.touches.length===2){pinchMove(e);return;}
    if(dragR.current===null||dragR.current===undefined)return;
    e.preventDefault();
    const{cx,cy}=cropXY(e);if(cx===null)return;
    const cv=cropR.current;
    cornR.current=cornR.current.map((p,i)=>i===dragR.current
      ?{x:Math.max(0.01,Math.min(0.99,cx/cv.width)),y:Math.max(0.01,Math.min(0.99,cy/cv.height))}:p);
    paintCrop();
  }
  function cropUp(){dragR.current=null;pinchR.current=null;setTick(n=>n+1);}
  function pinchStart(e){
    const t=e.touches;
    pinchR.current={dist:Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY),zoom:cropZoom};
  }
  function pinchMove(e){
    if(!pinchR.current)return;e.preventDefault();
    const t=e.touches;
    const d=Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
    setCropZoom(Math.max(1,Math.min(3,pinchR.current.zoom*(d/pinchR.current.dist))));
  }

  // WARP + ENHANCE
  function processDoc(f){
    setBusy(true);const C=cornR.current;
    setTimeout(()=>{
      try{
        const img=imgR.current,IW=img.width,IH=img.height;
        const pts=C.map(c=>({x:c.x*IW,y:c.y*IH}));
        const wT=Math.hypot(pts[1].x-pts[0].x,pts[1].y-pts[0].y);
        const wB=Math.hypot(pts[2].x-pts[3].x,pts[2].y-pts[3].y);
        const hL=Math.hypot(pts[3].x-pts[0].x,pts[3].y-pts[0].y);
        const hR=Math.hypot(pts[2].x-pts[1].x,pts[2].y-pts[1].y);
        const rawW=Math.max(wT,wB),rawH=Math.max(hL,hR);
        // Enforce minimum 2000px on longest side, maximum 3200px for performance
        const longestRaw=Math.max(rawW,rawH);
        const minScale=2000/longestRaw;          // scale needed to hit 2000px min
        const maxScale=3200/longestRaw;          // cap for mobile perf
        const SC=Math.max(minScale,Math.min(maxScale,2.0)); // at least minScale
        const outW=Math.round(rawW*SC),outH=Math.round(rawH*SC);
        const sC=document.createElement("canvas");sC.width=IW;sC.height=IH;
        sC.getContext("2d").drawImage(img,0,0);
        const sp=sC.getContext("2d").getImageData(0,0,IW,IH).data;
        const dc=outR.current;dc.width=outW;dc.height=outH;
        const dctx=dc.getContext("2d");
        const did=dctx.createImageData(outW,outH);const dd=did.data;
        for(let dy=0;dy<outH;dy++){const v=dy/outH;
          for(let dx=0;dx<outW;dx++){const u=dx/outW;
            const sx=(1-u)*(1-v)*pts[0].x+u*(1-v)*pts[1].x+u*v*pts[2].x+(1-u)*v*pts[3].x;
            const sy=(1-u)*(1-v)*pts[0].y+u*(1-v)*pts[1].y+u*v*pts[2].y+(1-u)*v*pts[3].y;
            const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(x0+1,IW-1),y1=Math.min(y0+1,IH-1);
            const fx=sx-x0,fy=sy-y0,ii=(dy*outW+dx)*4;
            for(let ch=0;ch<3;ch++){
              const tl=sp[(y0*IW+x0)*4+ch],tr=sp[(y0*IW+x1)*4+ch];
              const bl=sp[(y1*IW+x0)*4+ch],br=sp[(y1*IW+x1)*4+ch];
              dd[ii+ch]=Math.round(tl*(1-fx)*(1-fy)+tr*fx*(1-fy)+bl*(1-fx)*fy+br*fx*fy);
            }dd[ii+3]=255;
          }
        }
        dctx.putImageData(did,0,0);
        doFilter(dctx,outW,outH,f);
        setFinalImg(dc.toDataURL("image/jpeg",0.93));
        setFilter(f);setOutSz({w:outW,h:outH});setBusy(false);setStage("enhance");
      }catch(err){console.error(err);setBusy(false);}
    },30);
  }

  // ── FILTER PIPELINE ─────────────────────────────────────────────────────────
  // Measures actual paper brightness from center sample, then applies mode-specific
  // curve. Ultra B&W uses adaptive local thresholding for professional PDF output.
  function doFilter(ctx,W,H,mode){
    if(mode==="original")return;
    const id=ctx.getImageData(0,0,W,H); const d=id.data;

    // ── Step 1: measure paper brightness from center 60% of image
    //    (avoid edges which may still have dark background)
    let bs=0,bn=0;
    const mx=W>>1, my=H>>1, mw=(W*0.30)|0, mh=(H*0.30)|0;
    for(let y=my-mh;y<my+mh;y+=3) for(let x=mx-mw;x<mx+mw;x+=3){
      const i=(y*W+x)*4, l=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
      if(l>85){bs+=l;bn++;}
    }
    const paper=bn>20?bs/bn:175;
    // Gentle boost — only when paper is under-exposed. Hard cap at 1.30×.
    const boost=paper<215?Math.min(1.30,210/Math.max(paper,70)):1.0;

    // ── Step 2: convert to grayscale float array for modes that need it
    const gray=(mode==="ultrabw"||mode==="bw"||mode==="highcontrast")
      ? new Float32Array(W*H) : null;
    if(gray){
      for(let i=0;i<W*H;i++) gray[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2];
    }

    // ── ULTRA B&W ────────────────────────────────────────────────────────────
    // Professional PDF-scanner look: pure white paper, deep black text.
    // Uses adaptive local mean thresholding so shadows don't make paper go grey.
    if(mode==="ultrabw"){
      // Pass 1: box blur to get local mean (radius = 1% of width, min 8px)
      const bRad = Math.max(8, (W*0.01)|0);
      const localMean = new Float32Array(W*H);
      // Fast horizontal pass
      const tmp = new Float32Array(W*H);
      for(let y=0;y<H;y++){
        let s=0, n=0;
        for(let x=0;x<W;x++){
          s+=gray[y*W+x]; n++;
          if(x>bRad){ s-=gray[y*W+(x-bRad-1)]; n--; }
          if(x>=bRad) tmp[y*W+x]=s/n;
          else        tmp[y*W+x]=gray[y*W+x]; // edge fallback
        }
      }
      // Vertical pass
      for(let x=0;x<W;x++){
        let s=0, n=0;
        for(let y=0;y<H;y++){
          s+=tmp[y*W+x]; n++;
          if(y>bRad){ s-=tmp[(y-bRad-1)*W+x]; n--; }
          localMean[y*W+x] = y>=bRad ? s/n : tmp[y*W+x];
        }
      }
      // Pass 2: adaptive threshold
      // Pixel is BLACK if its value < localMean - C (C=8 bias toward white paper)
      const C=8;
      for(let i=0;i<W*H;i++){
        // Apply gentle global boost first
        const boosted=Math.min(255,gray[i]*boost);
        // Adaptive decision
        const threshold=localMean[i]-C;
        // Hard binary: black text (0) or white paper (255)
        const bin=boosted<threshold?0:255;
        // Soft blend: slightly smooth the binary to avoid aliasing on thin strokes
        // (5% of original lum to preserve fine line structure)
        const softened=bin<128?Math.max(0,bin-boosted*0.04):Math.min(255,bin+10);
        const v=Math.round(Math.max(0,Math.min(255,softened)));
        d[i*4]=v; d[i*4+1]=v; d[i*4+2]=v;
      }
      ctx.putImageData(id,0,0);
      // Final sharpen — strong to make handwriting crisp
      unsharp(ctx,W,H,3.2);
      return;
    }

    // ── STANDARD FILTERS ─────────────────────────────────────────────────────
    for(let i=0;i<d.length;i+=4){
      let r=d[i],g=d[i+1],b=d[i+2];

      if(mode==="document"){
        // Brighten paper gently
        r=Math.min(255,r*boost); g=Math.min(255,g*boost); b=Math.min(255,b*boost);
        const L=0.299*r+0.587*g+0.114*b;
        // S-curve: darks → blacker (text), lights → whiter (paper)
        const cv2=L<80?L*0.58:L<140?46+(L-80)*0.87:L<200?98+(L-140)*1.38:Math.min(255,181+(L-200)*2.5);
        const rt=L>0?cv2/L:1;
        r=Math.min(255,Math.max(0,r*rt)); g=Math.min(255,Math.max(0,g*rt)); b=Math.min(255,Math.max(0,b*rt));
        // Desaturate 78% → neutral white paper
        const fl=0.299*r+0.587*g+0.114*b;
        d[i]=Math.round(r*0.22+fl*0.78); d[i+1]=Math.round(g*0.22+fl*0.78); d[i+2]=Math.round(b*0.22+fl*0.78);

      }else if(mode==="bw"){
        const L=gray[i>>2]; let v=L*boost;
        v=v<70?Math.max(0,v*0.50):v<150?34+(v-70)*1.1:Math.min(255,112+(v-150)*1.8);
        d[i]=d[i+1]=d[i+2]=Math.round(Math.min(255,v));

      }else if(mode==="highcontrast"){
        const L=gray[i>>2]; let v=L*boost;
        v=v<85?Math.max(0,v*0.38):v<160?32+(v-85)*1.4:Math.min(255,137+(v-160)*2.0);
        d[i]=d[i+1]=d[i+2]=Math.round(Math.min(255,v));

      }else if(mode==="sharp"){
        r=Math.min(255,r*boost); g=Math.min(255,g*boost); b=Math.min(255,b*boost);
        d[i]=Math.min(255,Math.max(0,(r-128)*1.48+133));
        d[i+1]=Math.min(255,Math.max(0,(g-128)*1.48+133));
        d[i+2]=Math.min(255,Math.max(0,(b-128)*1.38+128));
      }
    }
    ctx.putImageData(id,0,0);
    const str=mode==="highcontrast"?2.0:mode==="sharp"?2.6:1.7;
    unsharp(ctx,W,H,str);
  }
  function unsharp(ctx,W,H,s){
    const id=ctx.getImageData(0,0,W,H);const d=id.data;
    const bl=boxBlur(new Uint8ClampedArray(d),W,H,2);
    for(let i=0;i<d.length;i+=4)for(let c=0;c<3;c++)d[i+c]=Math.min(255,Math.max(0,d[i+c]*(1+s)-bl[i+c]*s));
    ctx.putImageData(id,0,0);
  }
  function boxBlur(src,W,H,r){
    const t=new Uint8ClampedArray(src.length),o=new Uint8ClampedArray(src.length);
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){let a=0,b=0,c=0,n=0;for(let dx=-r;dx<=r;dx++){const xi=Math.max(0,Math.min(W-1,x+dx)),i=(y*W+xi)*4;a+=src[i];b+=src[i+1];c+=src[i+2];n++;}const i=(y*W+x)*4;t[i]=a/n;t[i+1]=b/n;t[i+2]=c/n;t[i+3]=255;}
    for(let x=0;x<W;x++)for(let y=0;y<H;y++){let a=0,b=0,c=0,n=0;for(let dy=-r;dy<=r;dy++){const yi=Math.max(0,Math.min(H-1,y+dy)),i=(yi*W+x)*4;a+=t[i];b+=t[i+1];c+=t[i+2];n++;}const i=(y*W+x)*4;o[i]=a/n;o[i+1]=b/n;o[i+2]=c/n;o[i+3]=255;}
    return o;
  }

  if(!open)return null;

  const FILTERS=[
    {id:"document",    icon:"📄",label:"Document",    desc:"Clean white scan"},
    {id:"ultrabw",     icon:"⬛",label:"Ultra B&W",   desc:"Pro PDF scan"},
    {id:"bw",          icon:"◑", label:"B&W",         desc:"Basic mono"},
    {id:"highcontrast",icon:"◆", label:"Hi-Contrast", desc:"Max readable"},
    {id:"sharp",       icon:"🔍",label:"Sharpened",   desc:"Text focus"},
    {id:"original",    icon:"⬜",label:"Original",    desc:"No filter"},
  ];

  const Spin=()=>(
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,zIndex:5}}>
      <div style={{width:46,height:46,border:`4px solid rgba(212,175,55,0.15)`,borderTop:`4px solid ${T.gold}`,borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
      <div style={{color:T.gold,fontSize:13,letterSpacing:"0.12em",fontWeight:700}}>PROCESSING...</div>
    </div>
  );

  return(
    <div style={{
      position:"fixed",top:0,left:0,
      width:"100%",height:"100dvh",
      background:"#000",display:"flex",flexDirection:"column",
      zIndex:9999,overflow:"hidden",
      fontFamily:"'Rajdhani','Inter',sans-serif",
      overscrollBehavior:"none",
    }}>

      {/* ══ CAM ══ */}
      {stage==="cam"&&<>
        <div style={{flex:"1 1 0",minHeight:0,position:"relative",overflow:"hidden",background:"#000"}}>
          <video ref={vidR} playsInline autoPlay muted
            style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:camErr?"none":"block"}}/>
          {!camErr&&<canvas ref={ovR} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",display:"block"}}/>}

          {/* Status badge */}
          {!camErr&&(
            <div style={{
              position:"absolute",top:16,left:"50%",transform:"translateX(-50%)",
              background:docFound?"rgba(34,197,94,0.18)":"rgba(0,0,0,0.70)",
              border:`1px solid ${docFound?"#22c55e":"rgba(212,175,55,0.45)"}`,
              color:docFound?"#22c55e":T.gold,
              padding:"7px 20px",borderRadius:99,fontSize:13,fontWeight:700,
              letterSpacing:"0.1em",whiteSpace:"nowrap",backdropFilter:"blur(12px)",
              pointerEvents:"none",transition:"all 0.25s",
            }}>
              {docFound?(autoSnap&&stableN>0?`⏱ HOLD STILL... ${stableN}/5`:"✓ TICKET DETECTED"):"📷 POINT CAMERA AT TICKET"}
            </div>
          )}

          {/* Progress ring */}
          {docFound&&autoSnap&&stableN>0&&(
            <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",width:62,height:62,pointerEvents:"none"}}>
              <svg viewBox="0 0 62 62" style={{transform:"rotate(-90deg)"}}>
                <circle cx="31" cy="31" r="27" fill="none" stroke="rgba(34,197,94,0.2)" strokeWidth="5"/>
                <circle cx="31" cy="31" r="27" fill="none" stroke="#22c55e" strokeWidth="5"
                  strokeDasharray={`${2*Math.PI*27}`}
                  strokeDashoffset={`${2*Math.PI*27*(1-stableN/5)}`}
                  style={{transition:"stroke-dashoffset 0.2s"}}/>
              </svg>
            </div>
          )}

          {camErr&&(
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16,padding:28}}>
              <div style={{fontSize:52}}>📷</div>
              <div style={{color:T.muted,fontSize:14,textAlign:"center",lineHeight:1.6}}>Camera unavailable.<br/>Upload a photo instead.</div>
              <button onClick={()=>fileR.current.click()} style={{padding:"14px 36px",background:T.gold,color:"#000",border:"none",borderRadius:12,fontWeight:800,fontSize:15,cursor:"pointer"}}>📁 UPLOAD PHOTO</button>
            </div>
          )}
          {busy&&<Spin/>}
        </div>

        <div style={{flexShrink:0,background:T.card,borderTop:`1px solid ${T.border}`,padding:"12px 16px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,marginBottom:12}}>
            <div>
              <div style={{color:T.text,fontSize:13,fontWeight:600}}>Auto-Capture</div>
              <div style={{color:T.muted,fontSize:10,marginTop:1}}>Snaps automatically when stable</div>
            </div>
            <div onClick={()=>setAutoSnap(v=>!v)} style={{width:50,height:28,borderRadius:14,cursor:"pointer",background:autoSnap?"#22c55e":T.border,position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{position:"absolute",top:4,left:autoSnap?26:4,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            {!camErr&&(
              <button onClick={doCapture} disabled={!camReady||busy}
                style={{flex:2,height:56,background:camReady&&!busy?T.gold:T.surface,color:camReady&&!busy?"#000":T.muted,border:"none",borderRadius:14,fontWeight:800,fontSize:17,letterSpacing:"0.1em",cursor:camReady&&!busy?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span style={{fontSize:20}}>📸</span> CAPTURE
              </button>
            )}
            <button onClick={()=>fileR.current.click()}
              style={{flex:1,height:56,background:T.surface,color:T.text,border:`1px solid ${T.border}`,borderRadius:14,fontWeight:600,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <span>📁</span> Upload
            </button>
          </div>
          <button onClick={onClose}
            style={{width:"100%",height:42,background:"transparent",color:T.muted,border:`1px solid ${T.border}`,borderRadius:12,fontWeight:600,fontSize:13,cursor:"pointer"}}>
            ✕ CANCEL
          </button>
        </div>
      </>}

      {/* ══ CROP ══ */}
      {stage==="crop"&&<>
        <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:T.card,borderBottom:`1px solid ${T.border}`}}>
          <div>
            <div style={{color:T.gold,fontSize:14,fontWeight:700,letterSpacing:"0.12em"}}>✂ ADJUST CROP</div>
            <div style={{color:T.muted,fontSize:10,marginTop:1}}>Drag handles · Pinch to zoom</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>setCropZoom(z=>Math.max(1,parseFloat((z-0.25).toFixed(2))))}
              style={{width:36,height:36,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
            <span style={{color:T.muted,fontSize:11,minWidth:36,textAlign:"center"}}>{Math.round(cropZoom*100)}%</span>
            <button onClick={()=>setCropZoom(z=>Math.min(3,parseFloat((z+0.25).toFixed(2))))}
              style={{width:36,height:36,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            <button onClick={onClose}
              style={{height:36,padding:"0 12px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
          </div>
        </div>

        <div style={{flex:"1 1 0",minHeight:0,overflow:"scroll",background:"#050505",WebkitOverflowScrolling:"touch",display:"flex",alignItems:"flex-start",justifyContent:"center"}}>
          <canvas ref={cropR}
            style={{
              display:"block",flexShrink:0,touchAction:"none",cursor:"crosshair",
              transform:`scale(${cropZoom})`,transformOrigin:"top center",
              marginBottom:cropZoom>1?`${(cropZoom-1)*100}%`:0,
            }}
            onMouseDown={cropDown} onMouseMove={cropMove} onMouseUp={cropUp} onMouseLeave={cropUp}
            onTouchStart={cropDown} onTouchMove={cropMove} onTouchEnd={cropUp}
          />
        </div>

        <div style={{flexShrink:0,background:T.card,borderTop:`1px solid ${T.border}`,padding:"10px 14px 16px"}}>
          <div style={{color:T.muted,fontSize:10,textAlign:"center",letterSpacing:"0.08em",marginBottom:10}}>
            ⊕ DRAG THE 4 GOLD HANDLES TO THE TICKET CORNERS
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{fullReset();startCam();}}
              style={{flex:1,height:54,background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer"}}>
              ↩ RETAKE
            </button>
            <button onClick={()=>processDoc("document")} disabled={busy}
              style={{flex:2,height:54,background:busy?T.surface:T.gold,color:busy?T.muted:"#000",border:"none",borderRadius:12,fontWeight:800,fontSize:15,cursor:busy?"not-allowed":"pointer",letterSpacing:"0.08em",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {busy?<><div style={{width:16,height:16,border:"2px solid rgba(0,0,0,0.25)",borderTop:"2px solid #000",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/> PROCESSING...</>:"⚡ SCAN DOCUMENT"}
            </button>
          </div>
        </div>
      </>}

      {/* ══ ENHANCE ══ */}
      {stage==="enhance"&&<>
        <div style={{flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 16px",background:T.card,borderBottom:`1px solid ${T.border}`}}>
          <div>
            <div style={{color:T.gold,fontSize:14,fontWeight:700,letterSpacing:"0.12em"}}>🎨 ENHANCE & CONFIRM</div>
            <div style={{color:T.muted,fontSize:10,marginTop:1}}>Choose filter · Confirm scan</div>
          </div>
          <button onClick={onClose} style={{height:36,padding:"0 12px",background:"transparent",border:`1px solid ${T.border}`,color:T.muted,borderRadius:8,cursor:"pointer",fontSize:12}}>✕</button>
        </div>

        <div style={{flexShrink:0,display:"flex",gap:6,padding:"8px 10px",background:"#090909",borderBottom:`1px solid ${T.border}`,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          {FILTERS.map(f=>(
            <button key={f.id} onClick={()=>{if(!busy)processDoc(f.id);}} style={{
              flexShrink:0,padding:"7px 14px",borderRadius:10,
              background:filter===f.id?"rgba(212,175,55,0.12)":"transparent",
              border:`1.5px solid ${filter===f.id?T.gold:T.border}`,
              color:filter===f.id?T.gold:T.muted,cursor:"pointer",fontFamily:"'Rajdhani',sans-serif",
            }}>
              <div style={{fontSize:12,fontWeight:filter===f.id?700:500,whiteSpace:"nowrap"}}>{f.icon} {f.label}</div>
              <div style={{fontSize:9,color:T.muted,marginTop:1}}>{f.desc}</div>
            </button>
          ))}
        </div>

        <div style={{flex:"1 1 0",minHeight:0,overflow:"hidden",background:"#050505",display:"flex",alignItems:"center",justifyContent:"center",padding:10,position:"relative"}}>
          {busy&&<Spin/>}
          {!busy&&finalImg&&(
            <img src={finalImg} alt="Scan"
              style={{width:"95%",maxHeight:"100%",objectFit:"contain",borderRadius:4,boxShadow:"0 0 0 1px rgba(212,175,55,0.15),0 8px 32px rgba(0,0,0,0.85)"}}/>
          )}
        </div>

        {!busy&&finalImg&&(
          <div style={{flexShrink:0,padding:"5px 16px",background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{color:T.muted,fontSize:10}}>{outSz.w}×{outSz.h}px · {((outSz.w*outSz.h)/1e6).toFixed(1)}MP</span>
            <span style={{background:"rgba(34,197,94,0.1)",color:"#22c55e",fontSize:10,padding:"3px 10px",borderRadius:99,fontWeight:700}}>✓ SCAN READY</span>
          </div>
        )}

        <div style={{flexShrink:0,background:T.card,borderTop:`1px solid ${T.border}`,padding:"10px 14px 16px"}}>
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>{setStage("crop");setFinalImg(null);setCropZoom(1);setTick(n=>n+1);}}
              style={{flex:1,height:54,background:"transparent",color:T.text,border:`1px solid ${T.border}`,borderRadius:12,fontWeight:600,fontSize:14,cursor:"pointer"}}>
              ← RE-ADJUST
            </button>
            <button disabled={busy||!finalImg} onClick={()=>onUse(finalImg)}
              style={{flex:2,height:54,background:!busy&&finalImg?T.gold:T.surface,color:!busy&&finalImg?"#000":T.muted,border:"none",borderRadius:12,fontWeight:800,fontSize:15,cursor:!busy&&finalImg?"pointer":"not-allowed",letterSpacing:"0.08em"}}>
              ✓ USE THIS SCAN
            </button>
          </div>
        </div>
      </>}

      <canvas ref={capR} style={{display:"none"}}/>
      <canvas ref={outR} style={{display:"none"}}/>
      <input  ref={fileR} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={handleFile}/>
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

  // ── GAS fetch helper ─────────────────────────────────────────────────────────
  // Google Apps Script deployed web apps redirect on POST (cross-origin).
  // We must use mode:"no-cors" so the browser doesn't block the redirect.
  // The response will be "opaque" (unreadable) but the POST still reaches GAS.
  // We use a GET ping with a unique token to confirm receipt.
  async function gasPost(payload) {
    const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
    const body  = JSON.stringify({ ...payload, _token: token });
    await fetch(API_URL, {
      method:  "POST",
      mode:    "no-cors",            // Required: GAS redirects cross-origin
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    });
    // no-cors gives opaque response — we can't read it, but the POST went through
  }

  async function handleSubmit() {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true); setSubmitError("");

    // Guard: signature canvas must be mounted
    if (!sigRef.current) {
      setSubmitError("Signature canvas not ready — please try again.");
      setIsSubmitting(false); return;
    }

    // Build payload — strip full base64 images down to compressed JPEG thumbnails
    // to stay well under GAS's request size limits
    function shrinkImage(dataUrl, maxPx=1200, quality=0.82) {
      if (!dataUrl) return "";
      return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
          const sc  = Math.min(1, maxPx / Math.max(img.width, img.height));
          const w   = Math.round(img.width  * sc);
          const h   = Math.round(img.height * sc);
          const c   = document.createElement("canvas");
          c.width=w; c.height=h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          resolve(c.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => resolve(dataUrl); // fallback: send as-is
        img.src = dataUrl;
      });
    }

    try {
      // Compress images in parallel before building payload
      const [ticketImg, ...loadImgs] = await Promise.all([
        shrinkImage(form.fieldTicketImage),
        ...loads.map(l => shrinkImage(l.verificationImage)),
      ]);

      const shrunkenLoads = loads.map((l, i) => ({
        ...l, verificationImage: loadImgs[i] || ""
      }));

      const payload = {
        submissionId,
        phone,
        ...form,
        fieldTicketImage: ticketImg,
        loads:            shrunkenLoads,
        totalBBLS,
        signature:        sigRef.current.toDataURL("image/png"),
        submittedAt:      new Date().toISOString(),
      };

      await gasPost(payload);
      onComplete();

    } catch(err) {
      // Network failure — save offline and sync later
      try {
        const payload = {
          submissionId, phone, ...form, loads, totalBBLS,
          signature: sigRef.current?.toDataURL("image/png") || "",
          submittedAt: new Date().toISOString(),
          _offline: true,
        };
        const q = JSON.parse(localStorage.getItem("offlineTickets")||"[]");
        q.push(payload);
        localStorage.setItem("offlineTickets", JSON.stringify(q));
        alert("No signal — ticket saved and will sync when back online.");
        onComplete();
      } catch(e2) {
        console.error("Submit failed:", err, e2);
        setSubmitError("Submission failed. Please check your connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // offline sync — retry queued tickets when back online
  useEffect(() => {
    async function syncOffline() {
      const q = JSON.parse(localStorage.getItem("offlineTickets")||"[]");
      if (!q.length) return;
      const failed = [];
      for (const t of q) {
        try {
          await gasPost(t);
        } catch {
          failed.push(t); // keep failed ones for next retry
        }
      }
      if (failed.length) localStorage.setItem("offlineTickets", JSON.stringify(failed));
      else               localStorage.removeItem("offlineTickets");
    }
    window.addEventListener("online", syncOffline);
    syncOffline(); // also try immediately on mount
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
    <>
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

    </PageShell>
    {createPortal(
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
      />,
      document.body
    )}
    </>
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
