// src/App.jsx

import {
  Route,
  Routes,
  useLocation
} from "react-router-dom";

import {
  lazy,
  Suspense
} from "react";

import LoadingSpinner from "./components/shared/LoadingSpinner";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/admin/AdminRoute";
import RootRedirect from "./components/RootRedirect";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

const Home = lazy(() =>
  import("./pages/Home")
);

const Welcome = lazy(() =>
  import("./pages/Welcome")
);

const NotFound = lazy(() =>
  import("./pages/NotFound")
);

const Contact = lazy(() =>
  import("./pages/Contact")
);

const Login = lazy(() =>
  import("./pages/Login")
);

const Register = lazy(() =>
  import("./pages/Register")
);

const ForgotPassword = lazy(() =>
  import("./pages/ForgotPassword")
);

const Profile = lazy(() =>
  import("./pages/Profile")
);

const Test = lazy(() =>
  import("./pages/Test")
);

const Curso = lazy(() =>
  import("./pages/Curso")
);

const Topics = lazy(() =>
  import("./pages/Temas")
);

const TemaDetalle = lazy(() =>
  import("./pages/TemaDetalle")
);

const PersonalizedMission = lazy(() =>
  import("./pages/PersonalizedMissionPage")
);

const MissionChatPage = lazy(() =>
  import("./pages/MissionChatPage")
);

const Nivel = lazy(() =>
  import("./pages/Nivel")
);

const VerificationPending = lazy(() =>
  import("./pages/VerificationPending")
);

const Foro = lazy(() =>
  import("./pages/Foro")
);

const Admin = lazy(() =>
  import("./components/admin/Admin")
);

const AdminAILessons = lazy(() =>
  import("./pages/AdminAILessons")
);

const Lessons = lazy(() =>
  import("./components/Lessons")
);

const Tests = lazy(() =>
  import("./components/TestsSection")
);

const AdminTemas = lazy(() =>
  import("./components/admin/AdminTemas")
);

const AdminForumReportsPage = lazy(() =>
  import("./pages/AdminForumReports")
);

const AdminMissions = lazy(() =>
  import("./components/admin/AdminMissions")
);

const AdminModules = lazy(() =>
  import("./components/admin/AdminModules")
);

function App() {
  const location = useLocation();

  const hideHeaderFooterRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/verification-pending"
  ];

  const hideHeaderFooter =
    hideHeaderFooterRoutes.includes(
      location.pathname
    );

  const hideFooter =
    hideHeaderFooter ||
    location.pathname.startsWith(
      "/curso/"
    );

  return (
    <div className="app-container">
        <ScrollToTop />

        {!hideHeaderFooter && (
          <Header />
        )}

        <main className="content">
          <Suspense
            fallback={
              <LoadingSpinner />
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <RootRedirect />
                }
              />

              <Route
                path="/welcome"
                element={<Welcome />}
              />

              <Route
                path="/login"
                element={<Login />}
              />

              <Route
                path="/register"
                element={<Register />}
              />

              <Route
                path="/forgot-password"
                element={
                  <ForgotPassword />
                }
              />

              <Route
                path="/contact"
                element={<Contact />}
              />

              <Route
                path="/verification-pending"
                element={
                  <VerificationPending />
                }
              />

              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />

              <Route
                path="/test"
                element={
                  <PrivateRoute>
                    <Test />
                  </PrivateRoute>
                }
              />

              <Route
                path="/foro"
                element={
                  <PrivateRoute>
                    <Foro />
                  </PrivateRoute>
                }
              />

              <Route
                path="/curso"
                element={
                  <PrivateRoute>
                    <Curso />
                  </PrivateRoute>
                }
              />

              <Route
                path="/curso/:levelId"
                element={
                  <PrivateRoute>
                    <Nivel />
                  </PrivateRoute>
                }
              />

              <Route
                path="/temas"
                element={
                  <PrivateRoute>
                    <Topics />
                  </PrivateRoute>
                }
              />

              <Route
                path="/tema/:temaTitle"
                element={
                  <PrivateRoute>
                    <TemaDetalle />
                  </PrivateRoute>
                }
              />

              <Route
                path="/tema/:temaTitle/custom-mission"
                element={
                  <PrivateRoute>
                    <PersonalizedMission />
                  </PrivateRoute>
                }
              />

              <Route
                path="/tema/:temaTitle/mission-chat"
                element={
                  <PrivateRoute>
                    <MissionChatPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/tema/:temaTitle/mission/:missionId"
                element={
                  <PrivateRoute>
                    <MissionChatPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/lessons"
                element={
                  <AdminRoute>
                    <Lessons />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/tests"
                element={
                  <AdminRoute>
                    <Tests />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/temas"
                element={
                  <AdminRoute>
                    <AdminTemas />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/forum-reports"
                element={
                  <AdminRoute>
                    <AdminForumReportsPage />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/missions"
                element={
                  <AdminRoute>
                    <AdminMissions />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/ai-lessons"
                element={
                  <AdminRoute>
                    <AdminAILessons />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/modules"
                element={
                  <AdminRoute>
                    <AdminModules />
                  </AdminRoute>
                }
              />

              <Route
                path="*"
                element={<NotFound />}
              />
            </Routes>
          </Suspense>
        </main>

        {!hideFooter && (
          <Footer />
        )}
    </div>
  );
}

export default App;