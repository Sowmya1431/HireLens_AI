import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

export default function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    // If already logged in, redirect away from login/register to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
