const DEFAULT_API_ORIGIN = "http://localhost:8080";

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\/+$/, "");
};

const processEnvApiUrl = globalThis?.process?.env?.REACT_APP_API_URL;
const viteApiUrl = import.meta.env.VITE_API_BASE_URL;

export const API_ORIGIN = normalizeOrigin(processEnvApiUrl || viteApiUrl) || DEFAULT_API_ORIGIN;
export const API_BASE_URL = `${API_ORIGIN}/api`;
