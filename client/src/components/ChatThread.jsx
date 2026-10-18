import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, X, Globe2, Link2 } from "lucide-react";
import { Chats } from "../api/client";
import { useApp } from "../context/AppContext";
import Markdown from "./Markdown";
import SkillChips from "./SkillChips";
import { LogoMark } from "./Logo";

const MAX_IMG = 6;

// Rasmni siqib data URL'ga aylantiradi (telefon fotolari 5-10 MB bo'ladi)
export function fileToDataUrl(file, maxSide = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function Typing() {
  return <span className="typing"><i /><i /><i /></span>;
}

/**
 * Bitta suhbat oynasi.
 * convId/onConv — tanlangan suhbat; chatKey — "general" | "book:10-algebra" | "course:<id>"
 * attachments/setAttachments — tashqaridan (kitobdan belgilangan) rasmlar
 */
export default function ChatThread({
  convId, onConv, chatKey = "general", mode = "explain", extra = {}, intro, placeholder,
  attachments, setAttachments, suggestions = [], compact = false, bootText, onBootUsed,
}) {
  const { t, lang, errText, toast } = useApp();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [localImgs, setLocalImgs] = useState([]);
  const imgs = attachments ?? localImgs;
  const setImgs = setAttachments ?? setLocalImgs;
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const taRef = useRef(null);
  const skipLoad = useRef(null);

  useEffect(() => {
    if (!convId) { setMessages([]); return; }
    if (skipLoad.current === convId) { skipLoad.current = null; return; }
    let on = true;
    setLoading(true);
    Chats.get(convId)
      .then((r) => on && setMessages(r.messages))
      .catch(() => on && setMessages([]))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [convId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);

  const send = async (raw) => {
    const body = String(raw ?? text).trim();
    if ((!body && !imgs.length) || sending) return;
    const images = imgs.slice(0, MAX_IMG);
    setMessages((m) => [...m, { role: "user", text: body, images: images.map((i) => ({ img: i.image, page: i.page })) }]);
    setText("");
    setImgs([]);
    setSending(true);
    try {
      const r = await Chats.send({
        id: convId || undefined, key: chatKey, text: body, images, mode, lang,
        grade: extra.grade, subject: extra.subject, difficulty: extra.difficulty, web: extra.web,
      });
      setMessages((m) => [...m, { role: "ai", text: r.content, skills: r.skills, sources: r.sources }]);
      if (!convId) { skipLoad.current = r.id; onConv?.(r.id, r.title); }
    } catch (e) {
      toast(errText(e), "error");
      setMessages((m) => m.slice(0, -1));
      setText(body);
      setImgs(images);
    } finally {
      setSending(false);
    }
  };

  // Tashqaridan berilgan birinchi savol (masalan, "xatoni qayta o'rganish")
  useEffect(() => {
    if (bootText) { send(bootText); onBootUsed?.(); }
  }, [bootText]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickFiles = async (e) => {
    const files = [...(e.target.files || [])].filter((f) => f.type.startsWith("image/")).slice(0, MAX_IMG - imgs.length);
    e.target.value = "";
    const out = [];
    for (const f of files) {
      try { out.push({ image: await fileToDataUrl(f) }); } catch { /* o'tkazamiz */ }
    }
    setImgs([...imgs, ...out]);
  };

  const onPaste = async (e) => {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    e.preventDefault();
    const out = [];
    for (const f of files.slice(0, MAX_IMG - imgs.length)) out.push({ image: await fileToDataUrl(f) });
    setImgs([...imgs, ...out]);
  };

  const showIntro = !loading && messages.length === 0;

  return (
    <div className={`chat${compact ? " compact" : ""}`}>
      <div className="chat-scroll">
        {loading && <div className="center" style={{ padding: 30 }}><span className="spinner" /></div>}
        {showIntro && (
          <div className="msg ai">
            <span className="msg-av"><LogoMark size={30} /></span>
            <div className="bubble">
              <Markdown>{intro || t("chat.intro")}</Markdown>
              {suggestions.length > 0 && (
                <div className="sugg">
                  {suggestions.map((s) => <button key={s} className="chip btnlike" onClick={() => send(s)}>{s}</button>)}
                </div>
              )}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === "ai" && <span className="msg-av"><LogoMark size={30} /></span>}
            <div className="bubble">
              {m.images?.length > 0 && (
                <div className="msg-imgs">
                  {m.images.map((im, j) => (
                    <figure key={j}>
                      <img src={im.img} alt="" />
                      {im.page && <figcaption>{t("reader.page", { n: im.page })}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
              {m.role === "ai" ? <Markdown>{m.text}</Markdown> : m.text && <p className="user-text">{m.text}</p>}
              {m.role === "ai" && m.sources?.length > 0 && (
                <div className="sources">
                  {m.sources.slice(0, 4).map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="chip"><Link2 size={12} />{s.title.slice(0, 40)}</a>
                  ))}
                </div>
              )}
              {m.role === "ai" && <SkillChips ids={m.skills} />}
            </div>
          </div>
        ))}
        {sending && (
          <div className="msg ai">
            <span className="msg-av"><LogoMark size={30} /></span>
            <div className="bubble"><Typing /></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="composer">
        {imgs.length > 0 && (
          <div className="att-row">
            {imgs.map((im, i) => (
              <div key={i} className="att">
                <img src={im.image} alt="" />
                {im.page && <span>{im.page}</span>}
                <button onClick={() => setImgs(imgs.filter((_, j) => j !== i))} aria-label="remove"><X size={12} /></button>
              </div>
            ))}
          </div>
        )}
        <div className="composer-row">
          <button className="icon-btn" onClick={() => fileRef.current?.click()} title={t("chat.attach")} aria-label={t("chat.attach")}><Paperclip size={19} /></button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pickFiles} />
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            placeholder={placeholder || t("chat.placeholder")}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(160, e.target.scrollHeight) + "px";
            }}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
            }}
          />
          {extra.web && <span className="chip teal web-on" title={t("chat.webOn")}><Globe2 size={13} /></span>}
          <button className="send" onClick={() => send()} disabled={sending || (!text.trim() && !imgs.length)} aria-label={t("chat.send")}><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
