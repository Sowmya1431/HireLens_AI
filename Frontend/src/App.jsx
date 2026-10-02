import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import HireLensBot from "./components/HireLensBot";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Guest-only routes: redirect to /dashboard if already logged in */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* Protected App Routes: redirect to /login if unauthenticated */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard initialPage="dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ats"
          element={
            <ProtectedRoute>
              <Dashboard initialPage="ats" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/optimize"
          element={
            <ProtectedRoute>
              <Dashboard initialPage="optimize" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Dashboard initialPage="contact" />
            </ProtectedRoute>
          }
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <HireLensBot />
    </BrowserRouter>
  );
}

export default App;