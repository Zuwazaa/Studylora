import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { GRADES, subjectsOf, bookKey } from "../data/catalog";
import { useBooks } from "../lib/useBooks";
import { PageHead } from "../components/Layout";
import SubjectIcon from "../components/SubjectIcon";
import BookReader from "../components/BookReader";
import Iso from "../components/Iso";
import BookLoader from "../components/BookLoader";

export default function Library() {
  const { t, lang, user } = useApp();
  const { grade: g, subjId } = useParams();
  const nav = useNavigate();
  const books = useBooks();
  const grade = g ? Number(g) : null;

  if (g && !GRADES[grade]) return <Navigate to="/app/darsliklar" replace />;
  const subj = grade && subjId ? subjectsOf(grade).find((s) => s.id === subjId) : null;
  if (subjId && !subj) return <Navigate to={`/app/darsliklar/${grade}`} replace />;

  if (subj) {
    const key = bookKey(grade, subj.id);
    const url = books?.[key];
    if (!books) return <BookLoader />;
    if (!url) {
      return (
        <div className="card empty" style={{ maxWidth: 560, margin: "40px auto" }}>
          <Iso kind="books" size={120} />
          <b>{t("lib.noBook")}</b>
          <p>{t("lib.noBookSub", { grade, subject: subj[lang] })}</p>
          <div className="row wrap" style={{ justifyContent: "center", marginTop: 16 }}>
            <button className="btn btn-ghost sm" onClick={() => nav(`/app/darsliklar/${grade}`)}>{t("reader.back")}</button>
            <button className="btn btn-green sm" onClick={() => nav("/app/testlar", { state: { preset: { grade: String(grade), subject: subj.id } } })}>
              <ClipboardCheck size={16} />{t("lib.testAnyway")}
            </button>
          </div>
        </div>
      );
    }
    return (
      <BookReader
        key={key}
        title={`${subj[lang]} · ${t("grade.n", { n: grade })}`}
        pdfUrl={url}
        chatKey={`book:${key}`}
        grade={String(grade)}
        subject={subj.uz}
        bookKey={key}
        intro={t("reader.introBook", { subject: subj[lang] })}
        onBack={() => nav(`/app/darsliklar/${grade}`)}
      />
    );
  }

  return (
    <div>
      <PageHead title={t("lib.title")} accent={t("lib.accent")} sub={grade ? t("lib.pickSubject", { n: grade }) : t("lib.sub")} />
      <div className="crumbs">
        <button onClick={() => nav("/app/darsliklar")}>{t("lib.grades")}</button>
        {grade && <><ChevronRight size={14} /><span>{t("grade.n", { n: grade })}</span></>}
      </div>

      {!grade && (
        <div className="grade-grid">
          {Object.keys(GRADES).map((n) => (
            <button key={n} className={`grade-card${Number(n) === user?.grade ? " mine" : ""}`} onClick={() => nav(`/app/darsliklar/${n}`)}>
              <span className="grade-num">{n}</span>
              <span className="small muted">{t("lib.subjects", { n: GRADES[n].length })}</span>
            </button>
          ))}
        </div>
      )}

      {grade && (
        <div className="subj-grid">
          {subjectsOf(grade).map((s) => {
            const has = books?.[bookKey(grade, s.id)];
            return (
              <button key={s.id} className={`subj-card ${s.tone}`} onClick={() => nav(`/app/darsliklar/${grade}/${s.id}`)}>
                <span className="subj-ic"><SubjectIcon icon={s.icon} /></span>
                <b>{s[lang]}</b>
                <small>{books === null ? "…" : has ? t("lib.hasBook") : t("lib.soon")}</small>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
