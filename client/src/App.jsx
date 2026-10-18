import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import AuthPage, { ResetPassword } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Splash from "./components/Splash";
import BookLoader from "./components/BookLoader";

const Teacher = lazy(() => import("./pages/Teacher"));
const Library = lazy(() => import("./pages/Library"));
const Quiz = lazy(() => import("./pages/Quiz"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const Mistakes = lazy(() => import("./pages/Mistakes"));
const Progress = lazy(() => import("./pages/Progress"));
const Methods = lazy(() => import("./pages/Methods"));
const Settings = lazy(() => import("./pages/Settings"));

const Spinner = () => <div className="center" style={{ padding: 80 }}><span className="spinner lg" /></div>;

function Private({ children }) {
  const { user, booting } = useApp();
  const loc = useLocation();
  if (booting) return <div className="page-boot"><BookLoader /></div>;
  if (!user) return <Navigate to="/kirish" replace state={{ from: loc.pathname }} />;
  return children;
}

export default function App() {
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
