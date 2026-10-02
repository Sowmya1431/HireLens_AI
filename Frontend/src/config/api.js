/**
 * Centralized API Configuration
 * Production Render Backend: https://hirelens-ai-ywv3.onrender.com/api
 */

const envApi = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;

// If env is missing OR still pointing to localhost:5000, unconditionally use the live Render backend!
const rawApi =
  envApi && !envApi.includes("localhost:5000")
    ? envApi
    : "https://hirelens-ai-ywv3.onrender.com/api";

const cleanBase = String(rawApi).trim().replace(/\/+$/, "");

// API base URL for all endpoints: https://hirelens-ai-ywv3.onrender.com/api
export const API = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;

// Root backend URL: https://hirelens-ai-ywv3.onrender.com
export const BACKEND_URL = cleanBase.endsWith("/api")
  ? cleanBase.slice(0, -4)
  : cleanBase;

export default API;
