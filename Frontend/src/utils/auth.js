/**
 * Authentication Utilities for HireLens AI
 */

export function getToken() {
  return localStorage.getItem("token");
}

export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode JWT payload (Base64Url decode)
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    // If token has expired (exp in seconds), clear it and return false
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      localStorage.removeItem("token");
      return false;
    }

    return true;
  } catch {
    // If decoding failed, treat token as invalid
    localStorage.removeItem("token");
    return false;
  }
}

export function logout() {
  localStorage.removeItem("token");
}

export function getUserFromToken() {
  const token = getToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
