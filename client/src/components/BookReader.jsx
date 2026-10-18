import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ScanLine, ClipboardCheck, Layers3, Plus, MessagesSquare, ArrowLeft, X, Sparkles } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Chats, Me, getToken, apiUrl } from "../api/client";
import { useApp } from "../context/AppContext";
import ChatThread from "./ChatThread";
import BookLoader from "./BookLoader";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MAX_ATT = 5;
const MIN_SEL = 14;

/*
  PDF darslik o'quvchi + AI ustoz.
  - Bet har doim konteyner kengligiga moslab chiziladi, zoom bilan kattalashtiriladi.
  - "Belgilash" rejimida to'rtburchak chiziladi -> qism rasmi chatga biriktiriladi.
  - Bet raqami URL'da (?bet=17) va brauzerda eslab qolinadi.
*/
export default function BookReader({ title, pdfUrl, chatKey, intro, grade, subject, bookKey, courseId, onBack }) {
  const { t } = useApp();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const storeKey = `studylora.page.${chatKey}`;

  const areaRef = useRef(null);
  const canvasRef = useRef(null);
  const docRef = useRef(null);
  const renderRef = useRef(null);
  const dragRef = useRef(null);

  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(() => {
    const fromUrl = Number(params.get("bet"));
    let saved = 0;
    try { saved = Number(localStorage.getItem(storeKey)) || 0; } catch { /* ignore */ }
    return Math.max(1, fromUrl || saved || 1);
  });
  const [pageInput, setPageInput] = useState(String(page));
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [status, setStatus] = useState("loading");
  const [selecting, setSelecting] = useState(false);
  const [rect, setRect] = useState(null);
  const [atts, setAtts] = useState([]);
  const [convs, setConvs] = useState([]);
  const [convId, setConvId] = useState(null);
  const [tab, setTab] = useState("pdf"); // mobil: pdf | chat
  // AI paneli faqat belgilanganda (yoki tugma bosilganda) ochiladi
  const [chatOpen, setChatOpen] = useState(false);

  // PDF yuklash
  useEffect(() => {
    let on = true;
    setStatus("loading");
    // Yuklangan kitoblar faqat egasiga beriladi — token bilan so'raymiz
    const token = getToken();
    // Range so'rovlar: butun faylni kutmasdan faqat kerakli betlar yuklanadi
    const task = pdfjsLib.getDocument({
      url: apiUrl(pdfUrl),
      httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
      disableAutoFetch: true,
      disableStream: true,
      rangeChunkSize: 262144,
    });
    task.promise
      .then((doc) => {
        if (!on) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setPage((p) => Math.min(p, doc.numPages));
        setStatus("ready");
      })
      .catch(() => on && setStatus("error"));
    Me.activity("book").catch(() => {});
    return () => { on = false; task.destroy().catch(() => {}); };
  }, [pdfUrl]);

  // Shu kitob bo'yicha suhbatlar
  useEffect(() => {
    Chats.list(chatKey).then((r) => {
      setConvs(r.conversations || []);
      if (r.conversations[0]) setConvId(r.conversations[0].id);
    }).catch(() => {});
  }, [chatKey]);

  // Konteyner kengligi
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [status]);

  // Betni chizish
  useEffect(() => {
    const doc = docRef.current;
    if (status !== "ready" || !doc || !width) return;
    let cancelled = false;
    (async () => {
      const pg = await doc.getPage(page);
      if (cancelled) return;
      const base = pg.getViewport({ scale: 1 });
      const scale = ((width - 24) / base.width) * zoom;
      const vp = pg.getViewport({ scale });
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const canvas = canvasRef.current;
      canvas.width = Math.floor(vp.width * dpr);
      canvas.height = Math.floor(vp.height * dpr);
      canvas.style.width = `${Math.floor(vp.width)}px`;
      canvas.style.height = `${Math.floor(vp.height)}px`;
      renderRef.current?.cancel();
      const task = pg.render({ canvasContext: canvas.getContext("2d"), viewport: vp, transform: [dpr, 0, 0, dpr, 0, 0] });
      renderRef.current = task;
      await task.promise.catch(() => {});
      // Keyingi betni oldindan tayyorlab qo'yamiz
      if (!cancelled && page < doc.numPages) doc.getPage(page + 1).catch(() => {});
    })();
    try { localStorage.setItem(storeKey, String(page)); } catch { /* ignore */ }
    setPageInput(String(page));
    return () => { cancelled = true; };
  }, [page, zoom, width, status, storeKey]);

  const go = useCallback((p) => {
    const n = Math.max(1, Math.min(numPages || 1, p));
    setPage(n);
    setParams((prev) => { const x = new URLSearchParams(prev); x.set("bet", String(n)); return x; }, { replace: true });
  }, [numPages, setParams]);

  useEffect(() => {
    const onKey = (e) => {
      if (/input|textarea/i.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  // Belgilash
  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(r.width, e.clientX - r.left)), y: Math.max(0, Math.min(r.height, e.clientY - r.top)) };
  };
  const down = (e) => {
    if (!selecting) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const p = pos(e);
    dragRef.current = p;
    setRect({ x: p.x, y: p.y, w: 0, h: 0 });
  };
  const move = (e) => {
    if (!dragRef.current) return;
    const p = pos(e), s = dragRef.current;
    setRect({ x: Math.min(s.x, p.x), y: Math.min(s.y, p.y), w: Math.abs(p.x - s.x), h: Math.abs(p.y - s.y) });
  };
  const up = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    const r = rect;
    setRect(null);
    if (!r || r.w < MIN_SEL || r.h < MIN_SEL) return;
    if (atts.length >= MAX_ATT) return;
    const canvas = canvasRef.current;
    const k = canvas.width / canvas.getBoundingClientRect().width;
    const out = document.createElement("canvas");
    out.width = Math.round(r.w * k);
    out.height = Math.round(r.h * k);
    out.getContext("2d").drawImage(canvas, r.x * k, r.y * k, r.w * k, r.h * k, 0, 0, out.width, out.height);
    setAtts((a) => [...a, { image: out.toDataURL("image/jpeg", 0.9), page }]);
    setSelecting(false);
    setChatOpen(true);
    setTab("chat");
  };

  const testHere = () => nav("/app/testlar", { state: { preset: { grade, subject, bookKey, courseId, from: page, to: Math.min(numPages, page + 3) } } });
  const cardsHere = () => nav("/app/kartochkalar", { state: { preset: { grade, subject, bookKey, courseId, from: page, to: Math.min(numPages, page + 3) } } });

  return (
    <div className={`reader tab-${tab}${chatOpen ? " chat-open" : ""}`}>
      <div className="reader-top">
        <button className="btn btn-ghost sm" onClick={onBack}><ArrowLeft size={16} />{t("reader.back")}</button>
        <b className="reader-title">{title}</b>
        {chatOpen && <div className="reader-tabs seg">
          <button className={tab === "pdf" ? "on" : ""} onClick={() => setTab("pdf")}>{t("reader.book")}</button>
          <button className={tab === "chat" ? "on" : ""} onClick={() => setTab("chat")}>{t("reader.chat")}</button>
        </div>}
        <div className="row wrap reader-actions">
          <button className="btn btn-soft sm" onClick={testHere}><ClipboardCheck size={16} />{t("reader.testHere")}</button>
          <button className="btn btn-soft sm" onClick={cardsHere}><Layers3 size={16} />{t("reader.cardsHere")}</button>
          {!chatOpen && <button className="btn btn-soft sm" onClick={() => { setChatOpen(true); setTab("chat"); }}><Sparkles size={16} />{t("reader.askAi")}</button>}
        </div>
      </div>

      <div className="reader-body">
        <section className="reader-pdf card">
          <div className="pdf-bar">
            <button className="icon-btn" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="prev"><ChevronLeft size={19} /></button>
            <form onSubmit={(e) => { e.preventDefault(); go(Number(pageInput) || 1); }} className="row" style={{ gap: 6 }}>
              <input className="input page-input" value={pageInput} onChange={(e) => setPageInput(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
              <span className="small muted">/ {numPages || "…"}</span>
            </form>
            <button className="icon-btn" onClick={() => go(page + 1)} disabled={page >= numPages} aria-label="next"><ChevronRight size={19} /></button>
            <span className="grow" />
            <button className="icon-btn" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} aria-label="zoom out"><ZoomOut size={18} /></button>
            <span className="small muted">{Math.round(zoom * 100)}%</span>
            <button className="icon-btn" onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(1)))} aria-label="zoom in"><ZoomIn size={18} /></button>
            <button className={`btn sm ${selecting ? "btn-yellow" : "btn-green"}`} onClick={() => setSelecting((s) => !s)}>
              <ScanLine size={16} />{selecting ? t("reader.selecting") : t("reader.select")}
            </button>
          </div>
          <div className="pdf-area" ref={areaRef}>
            {status === "loading" && <BookLoader />}
            {status === "error" && <div className="empty"><b>{t("reader.error")}</b>{t("reader.errorSub")}</div>}
            <div className={`pdf-page${selecting ? " selecting" : ""}`} style={{ display: status === "ready" ? "block" : "none" }}
                 onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
              <canvas ref={canvasRef} />
              {rect && <div className="sel-rect" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }} />}
            </div>
          </div>
        </section>

        {chatOpen && <section className="reader-chat card">
          <div className="rc-head">
            <MessagesSquare size={17} />
            <select className="select sm grow" value={convId || ""} onChange={(e) => setConvId(e.target.value || null)}>
              <option value="">{t("reader.newChat")}</option>
              {convs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <button className="icon-btn" onClick={() => setConvId(null)} title={t("reader.newChat")}><Plus size={18} /></button>
            <button className="icon-btn" onClick={() => { setChatOpen(false); setTab("pdf"); }} title={t("reader.closeAi")}><X size={18} /></button>
          </div>
          <ChatThread
            compact
            convId={convId}
            onConv={(id, ttl) => { setConvId(id); setConvs((l) => [{ id, title: ttl }, ...l.filter((c) => c.id !== id)]); }}
            chatKey={chatKey}
            mode="explain"
            extra={{ grade, subject }}
            intro={intro || t("reader.intro")}
            placeholder={t("reader.placeholder")}
            attachments={atts}
            setAttachments={setAtts}
          />
        </section>}
      </div>
    </div>
  );
}
