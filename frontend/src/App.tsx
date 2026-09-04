// src/App.tsx
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { refreshAccessToken } from "./lib/api";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import CheckEmailPage from "./pages/CheckEmailPage";
import WorkspacePage from "./pages/WorkspacePage";
import LoginPage from "./pages/LoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import VerifyAccountPage from "./pages/VerifyAccountPage";
import NotFoundPage from "./pages/NotFoundPage";

function hasValidAccessToken() {
  const token = localStorage.getItem("kivo_access_token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean | null>(() => hasValidAccessToken() ? true : null);

  useEffect(() => {
    if (authenticated !== null) return;
    void refreshAccessToken().then((token) => setAuthenticated(Boolean(token)));
  }, [authenticated]);

  if (authenticated === null) return null;
  return authenticated ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  if (hasValidAccessToken()) return <Navigate to="/app" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
      <Route path="/signup" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
      <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
      <Route path="/check-email" element={<CheckEmailPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-account" element={<VerifyAccountPage />} />
      <Route path="/app" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
