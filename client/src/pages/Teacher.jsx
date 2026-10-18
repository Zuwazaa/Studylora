import SubjectPicker from "../components/SubjectPicker";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Upload, FileText, Globe2, MessagesSquare, X, Lightbulb, MessageCircleQuestion, NotebookPen, Presentation, Target, Repeat } from "lucide-react";
import { Chats, Courses } from "../api/client";
import { useApp } from "../context/AppContext";
import ChatThread from "../components/ChatThread";
import { usePedagogy } from "../components/SkillChips";
import SkillIcon from "../components/SkillIcon";
import { GRADES, subjectsOf } from "../data/catalog";
import BookReader from "../components/BookReader";

const MODE_ORDER = ["explain", "socratic", "homework", "feynman", "exam", "revision"];

export function mistakePrompt(m, lang) {
  const ru = lang === "ru";
  return [
    ru ? "В тесте я ошибся в этом вопросе." : "Testda shu savolga noto'g'ri javob berdim.",
    `${ru ? "Вопрос" : "Savol"}: ${m.question}`,
    `${ru ? "Мой ответ" : "Mening javobim"}: ${m.yourAnswer || "—"}`,
    `${ru ? "Правильный ответ" : "To'g'ri javob"}: ${m.correctAnswer}`,
    m.misconception ? `${ru ? "Заблуждение" : "Xato fikr"}: ${m.misconception}` : "",
    ru ? "Разбери мою ошибку, объясни тему заново другим способом и проверь меня одним вопросом."
      : "Xatoyimni tahlil qil, mavzuni boshqa usulda qaytadan tushuntir va bitta savol bilan tekshir.",
  ].filter(Boolean).join("\n");
}

function UploadBox({ onDone }) {
  const { t, lang, errText, toast } = useApp();
  const ref = useRef(null);
  const [state, setState] = useState(null);
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return toast(t("course.onlyPdf"), "error");
    if (file.size > 80 * 1024 * 1024) return toast(t("course.tooBig"), "error");
    try {
      setState({ name: file.name, stage: "upload" });
      const { course } = await Courses.upload(file, file.name.replace(/\.pdf$/i, ""));
      setState({ name: file.name, stage: "read" });
      const r = await Courses.process(course.id, lang);
      setState(null);
      onDone(r.course);
    } catch (e2) {
      setState(null);
      toast(errText(e2), "error");
    }
  };
  return (
    <>
      <button className="btn btn-soft sm block" onClick={() => ref.current?.click()} disabled={Boolean(state)}>
        {state ? <span className="spinner" /> : <Upload size={16} />}
        {state ? t(`course.stage.${state.stage}`) : t("course.upload")}
      </button>
      <input ref={ref} type="file" accept="application/pdf" hidden onChange={pick} />
    </>
  );
}

const MODE_ICONS = { explain: Lightbulb, socratic: MessageCircleQuestion, homework: NotebookPen, feynman: Presentation, exam: Target, revision: Repeat };
const ModeIcon = ({ id }) => { const I = MODE_ICONS[id]; return I ? <I size={14} /> : null; };

export default function Teacher() {
  const { t, lang, user } = useApp();
  const ped = usePedagogy();
  const [params, setParams] = useSearchParams();
  const loc = useLocation();
  const nav = useNavigate();
  const { courseId } = useParams();

  const [convs, setConvs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mode, setMode] = useState(loc.state?.mode || "explain");
  const [grade, setGrade] = useState(String(user?.grade || ""));
  const [subject, setSubject] = useState("");
  const [web, setWeb] = useState(false);
  const [boot, setBoot] = useState(() => (loc.state?.mistake ? mistakePrompt(loc.state.mistake, lang) : loc.state?.ask || ""));
  const [listOpen, setListOpen] = useState(false);
  const convId = params.get("chat") || null;

  const load = useCallback(() => {
    Chats.list("general").then((r) => setConvs(r.conversations)).catch(() => {});
    Courses.list().then((r) => setCourses(r.courses)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    if (loc.state?.mistake) setMode("explain");
  }, [loc.state]);

  const openConv = (id) => { setParams(id ? { chat: id } : {}); setListOpen(false); };
  const onConv = (id, title) => {
    setParams({ chat: id }, { replace: true });
    setConvs((l) => [{ id, title, updatedAt: new Date().toISOString() }, ...l.filter((c) => c.id !== id)]);
  };
  const removeConv = async (id) => {
    await Chats.remove(id).catch(() => {});
    setConvs((l) => l.filter((c) => c.id !== id));
    if (id === convId) openConv(null);
  };
  const removeCourse = async (id) => {
    if (!window.confirm(t("course.confirmDelete"))) return;
    await Courses.remove(id).catch(() => {});
    setCourses((l) => l.filter((c) => c.id !== id));
  };

  // Yuklangan kitob bo'yicha dars: PDF + chat
  if (courseId) {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return <div className="center" style={{ padding: 60 }}><span className="spinner lg" /></div>;
    return (
      <BookReader
        title={course.title}
        pdfUrl={course.fileUrl}
        chatKey={course.chatKey}
        intro={course.intro}
        courseId={course.id}
        onBack={() => nav("/app/ustoz")}
      />
    );
  }

  const subj = grade ? subjectsOf(grade).find((s) => s.id === subject) : null;
  const modeInfo = ped?.modes?.[mode];
  const skillsById = Object.fromEntries((ped?.skills || []).map((s) => [s.id, s]));

  return (
    <div className="teacher">
      <aside className={`t-side card${listOpen ? " open" : ""}`}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b>{t("teacher.chats")}</b>
          <button className="icon-btn t-side-close" onClick={() => setListOpen(false)}><X size={18} /></button>
        </div>
        <button className="btn btn-green sm block" onClick={() => openConv(null)}><Plus size={16} />{t("teacher.newChat")}</button>
        <div className="t-list">
          {convs.length === 0 && <p className="small muted">{t("teacher.noChats")}</p>}
          {convs.map((c) => (
            <div key={c.id} className={`t-item${c.id === convId ? " on" : ""}`}>
              <button className="grow" onClick={() => openConv(c.id)}>{c.title || t("teacher.untitled")}</button>
              <button className="icon-btn sm" onClick={() => removeConv(c.id)} aria-label="delete"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div className="t-courses">
          <b className="small">{t("course.mine")}</b>
          <p className="small muted">{t("course.hint")}</p>
          <UploadBox onDone={(c) => { setCourses((l) => [c, ...l]); nav(`/app/ustoz/kurs/${c.id}`); }} />
          {courses.map((c) => (
            <div key={c.id} className="t-item">
              <FileText size={15} />
              <button className="grow" onClick={() => nav(`/app/ustoz/kurs/${c.id}`)}>{c.title}</button>
              <button className="icon-btn sm" onClick={() => removeCourse(c.id)} aria-label="delete"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </aside>

      <section className="t-main card">
        <div className="t-head">
          <button className="icon-btn t-list-btn" onClick={() => setListOpen(true)} aria-label={t("teacher.chats")}><MessagesSquare size={19} /></button>
          <div className="modes">
            {MODE_ORDER.map((id) => (
              <button key={id} className={`mode${mode === id ? " on" : ""}`} onClick={() => setMode(id)} title={ped?.modes?.[id]?.short?.[lang]}>
                <ModeIcon id={id} />{ped?.modes?.[id]?.name?.[lang] || t(`mode.${id}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="t-ctx">
          <select className="select sm" value={grade} onChange={(e) => { setGrade(e.target.value); setSubject(""); }}>
            <option value="">{t("teacher.anyGrade")}</option>
            {Object.keys(GRADES).map((g) => <option key={g} value={g}>{t("grade.n", { n: g })}</option>)}
          </select>
          <SubjectPicker small grade={grade} value={subject} onChange={setSubject} disabled={!grade} emptyLabel={t("teacher.anySubject")} />
          <button className={`chip btnlike${web ? " on" : ""}`} onClick={() => setWeb((w) => !w)} title={t("chat.webHint")}><Globe2 size={13} />{t("chat.web")}</button>
          {modeInfo && (
            <div className="mode-skills">
              {modeInfo.skills.slice(0, 4).map((id) => skillsById[id] && (
                <span key={id} className="mini-skill" title={skillsById[id].short[lang]}>
                  <SkillIcon icon={skillsById[id].icon} color={skillsById[id].color} size={13} />
                  {skillsById[id].name[lang]}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChatThread
          convId={convId}
          onConv={onConv}
          chatKey="general"
          mode={mode}
          extra={{ grade, subject: subj ? subj.uz : "", web }}
          intro={t(`mode.${mode}.intro`)}
          suggestions={[t(`mode.${mode}.s1`), t(`mode.${mode}.s2`)]}
          bootText={boot}
          onBootUsed={() => setBoot("")}
        />
      </section>
      {listOpen && <div className="t-scrim" onClick={() => setListOpen(false)} />}
    </div>
  );
}
