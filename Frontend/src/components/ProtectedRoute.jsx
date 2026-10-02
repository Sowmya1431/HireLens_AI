import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    // Redirect unauthenticated users to /login and preserve requested path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
