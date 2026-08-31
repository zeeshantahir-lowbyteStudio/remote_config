import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { ConfigProvider } from "./context/ConfigContext";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import ParametersPage from "./pages/ParametersPage";
import ConditionsPage from "./pages/ConditionsPage";
import ExperimentsPage from "./pages/ExperimentsPage";
import EnvironmentsPage from "./pages/EnvironmentsPage";
import AppsPage from "./pages/AppsPage";
import PublishHistoryPage from "./pages/PublishHistoryPage";
import AuditLogPage from "./pages/AuditLogPage";
import UsersPage from "./pages/UsersPage";
import { hasRole } from "./lib/roles";
import ProjectsPage from "./pages/ProjectsPage";
import TrafficPage from "./pages/TrafficPage";

function getStoredUser() {
  const raw = localStorage.getItem("rc_user");
  const token = localStorage.getItem("rc_token");
  return raw && token ? JSON.parse(raw) : null;
}

export default function App() {
  const [user, setUser] = useState(getStoredUser());

  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={setUser} />} />
          <Route
            element={
              user ? (
                <Layout user={user} onLogout={() => { localStorage.removeItem("rc_token"); localStorage.removeItem("rc_user"); setUser(null); }} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          >
            <Route path="/" element={<ParametersPage user={user} />} />
            <Route path="/conditions" element={<ConditionsPage user={user} />} />
            <Route path="/experiments" element={<ExperimentsPage user={user} />} />
            <Route path="/environments" element={<EnvironmentsPage user={user} />} />
            <Route path="/apps" element={<AppsPage user={user} />} />
            <Route path="/history" element={<PublishHistoryPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/projects" element={<ProjectsPage user={user} />} />
            <Route path="/traffic" element={<TrafficPage user={user} />} />
            <Route
              path="/users"
              element={hasRole(user, "admin") ? <UsersPage currentUser={user} /> : <Navigate to="/" replace />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}