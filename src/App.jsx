import React from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import WelcomePage from "./assets/components/welcome-page.jsx";
import SubjectSelect from "./assets/components/subject-select.jsx";
import GradeLookup from "./assets/components/grade-lookup.jsx";
import SuperAdminLogin from "./assets/admin/admin-log.jsx";
import SuperAdminDashboard from "./assets/admin/admin-dash.jsx";

function WelcomePageRoute() {
  const navigate = useNavigate();
  return <WelcomePage onStartLookup={() => navigate("/lookup")} />;
}

function GradeLookupRoute() {
  const navigate = useNavigate();
  return <GradeLookup onBack={() => navigate("/lookup")} />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePageRoute />} />
      <Route path="/lookup" element={<SubjectSelect />} />
      <Route path="/lookup/:subjectKey" element={<GradeLookupRoute />} />
      <Route path="/itgrade-v3" element={<SuperAdminLogin />} />
      <Route path="/itgrade-v3/dashboard" element={<SuperAdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
