/**
 * Centralized API Configuration
 * Supports VITE_API_URL and VITE_BACKEND_URL from .env
 * Automatically normalizes trailing slashes and ensures /api path
 */

const rawApi =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "https://hirelens-ai-ywv3.onrender.com/api";

const cleanBase = String(rawApi).trim().replace(/\/+$/, "");

// API base URL for all endpoints: https://hirelens-ai-ywv3.onrender.com/api
export const API = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;

// Root backend URL: https://hirelens-ai-ywv3.onrender.com
export const BACKEND_URL = cleanBase.endsWith("/api")
  ? cleanBase.slice(0, -4)
  : cleanBase;

export default API;
