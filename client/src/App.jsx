import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import AuthPage, { ResetPassword } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Splash from "./components/Splash";
import BookLoader from "./components/BookLoader";

// Sahifalar alohida bo'laklarda; kirgandan keyin brauzer bo'sh paytida ularni oldindan yuklab qo'yadi
const pages = {
  Teacher: () => import("./pages/Teacher"),
  Library: () => import("./pages/Library"),
  Quiz: () => import("./pages/Quiz"),
  Flashcards: () => import("./pages/Flashcards"),
  Mistakes: () => import("./pages/Mistakes"),
  Progress: () => import("./pages/Progress"),
  Methods: () => import("./pages/Methods"),
  Settings: () => import("./pages/Settings"),
  Lab: () => import("./pages/Lab"),
};
const Teacher = lazy(pages.Teacher);
const Library = lazy(pages.Library);
const Quiz = lazy(pages.Quiz);
const Flashcards = lazy(pages.Flashcards);
const Mistakes = lazy(pages.Mistakes);
const Progress = lazy(pages.Progress);
const Methods = lazy(pages.Methods);
const Settings = lazy(pages.Settings);
const Lab = lazy(pages.Lab);

function usePrefetchPages(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1500));
    const order = ["Teacher", "Library", "Quiz", "Flashcards", "Mistakes", "Progress", "Lab", "Methods", "Settings"];
    let i = 0, stop = false;
    const next = () => { if (stop || i >= order.length) return; pages[order[i++]]().catch(() => {}).finally(() => idle(next)); };
    const id = setTimeout(() => idle(next), 1200);
    // Kitob o'quvchi (PDF) ham kerak bo'ladi
    const pdf = setTimeout(() => idle(() => import("./components/BookReader").catch(() => {})), 4000);
    return () => { stop = true; clearTimeout(id); clearTimeout(pdf); };
  }, [enabled]);
}

const Spinner = () => <div className="center" style={{ padding: 80 }}><span className="spinner lg" /></div>;

function Private({ children }) {
  const { user, booting } = useApp();
  const loc = useLocation();
  if (booting) return <div className="page-boot"><BookLoader /></div>;
  if (!user) return <Navigate to="/kirish" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
  const { user } = useApp();
  usePrefetchPages(Boolean(user));
  return (
    <>
    <Splash />
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/kirish" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/app" element={<Private><Layout /></Private>}>
          <Route index element={<Dashboard />} />
          <Route path="ustoz" element={<Teacher />} />
          <Route path="ustoz/kurs/:courseId" element={<Teacher />} />
          <Route path="darsliklar" element={<Library />} />
          <Route path="darsliklar/:grade" element={<Library />} />
          <Route path="darsliklar/:grade/:subjId" element={<Library />} />
          <Route path="testlar" element={<Quiz />} />
          <Route path="kartochkalar" element={<Flashcards />} />
          <Route path="xatolar" element={<Mistakes />} />
          <Route path="natijalar" element={<Progress />} />
          <Route path="laboratoriya" element={<Lab />} />
          <Route path="laboratoriya/:expId" element={<Lab />} />
          <Route path="metodika" element={<Methods />} />
          <Route path="sozlamalar" element={<Settings />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </>
  );
}
