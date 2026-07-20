import axios from "axios";
import { CSRF_HEADER_NAME, DEFAULT_CSRF_COOKIE_NAME, SAFE_HTTP_METHODS } from "../../../shared/auth.js";
import { readCookieValue } from "../utils/cookieHelpers.js";

const env = import.meta.env || {};
const safeMethods = new Set(SAFE_HTTP_METHODS.map((method) => method.toLowerCase()));
const csrfCookieName = env.VITE_CSRF_COOKIE_NAME || DEFAULT_CSRF_COOKIE_NAME;

export const resolveApiBaseUrl = (envBaseUrl, locationLike = globalThis.location) => {
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const protocol = locationLike?.protocol || "http:";
  const hostname = locationLike?.hostname || "127.0.0.1";

  return `${protocol}//${hostname}:5001/api`;
};

const baseURL = resolveApiBaseUrl(env.VITE_API_URL);

const api = axios.create({
  baseURL,
  withCredentials: true
});
export const publicApi = axios.create({ baseURL });

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use((config) => {
  const method = String(config.method || "get").toLowerCase();

  if (!safeMethods.has(method)) {
    const csrfToken = readCookieValue(csrfCookieName);

    if (csrfToken) {
      config.headers[CSRF_HEADER_NAME] = csrfToken;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof unauthorizedHandler === "function") {
      unauthorizedHandler(error);
    }

    return Promise.reject(error);
  }
);

export default api;
