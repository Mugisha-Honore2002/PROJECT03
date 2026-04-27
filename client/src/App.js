import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import LoginPage from "./Components/login";
import RegisterPage from "./Components/RegisterPage";
import StudentDashboard from "./Components/StudentDashboard";
import TeacherDashboard from "./Components/TeacherDashboard";
import SupervisorDashboard from "./Components/SupervisorDashboard";

// ── helpers ───────────────────────────────────────────────────
const getAuth = () => ({
  token: localStorage.getItem("token"),
  role:  localStorage.getItem("role"),   // "student" | "teacher" | "supervisor"
});

// ── ProtectedRoute ────────────────────────────────────────────
// Blocks access if no token OR if the role doesn't match.
// Redirects to /loginpage and remembers where you tried to go.
const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, role } = getAuth();
  const location = useLocation();

  if (!token) {
    // no token → send to login, remember intended path
    return <Navigate to="/loginpage" state={{ from: location }} replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // wrong role → send to their own dashboard
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
};

// ── PublicRoute ───────────────────────────────────────────────
// If already logged in, skip login/register and go straight to dashboard.
const PublicRoute = ({ children }) => {
  const { token, role } = getAuth();
  if (token && role) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  return children;
};

// ── App ───────────────────────────────────────────────────────
const App = () => {
  return (
    <Router>
      <Routes>

        {/* public — redirect to dashboard if already logged in */}
        <Route path="/" element={
          <PublicRoute><RegisterPage /></PublicRoute>
        } />
        <Route path="/loginpage" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />

        {/* protected dashboards */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/supervisor/dashboard" element={
          <ProtectedRoute allowedRole="supervisor">
            <SupervisorDashboard />
          </ProtectedRoute>
        } />

        {/* catch-all → login */}
        <Route path="*" element={<Navigate to="/loginpage" replace />} />

      </Routes>
    </Router>
  );
};

export default App;