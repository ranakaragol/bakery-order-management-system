import crypto from "crypto";
import {
  DEFAULT_AUTH_COOKIE_MAX_AGE_MS,
  DEFAULT_AUTH_COOKIE_NAME,
  DEFAULT_CSRF_COOKIE_NAME
} from "../../../shared/auth.js";

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const normalizeSameSite = (value = "lax") => {
  const normalizedValue = String(value || "lax").trim().toLowerCase();

  if (["strict", "lax", "none"].includes(normalizedValue)) {
    return normalizedValue;
  }

  return "lax";
};

const parseCookieHeader = (cookieHeader = "") =>
  String(cookieHeader || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      return {
        ...cookies,
        [key]: decodeURIComponent(value)
      };
    }, {});

export const getAuthCookieName = () => process.env.AUTH_COOKIE_NAME || DEFAULT_AUTH_COOKIE_NAME;
export const getCsrfCookieName = () => process.env.CSRF_COOKIE_NAME || DEFAULT_CSRF_COOKIE_NAME;
export const getAuthCookieSameSite = () => normalizeSameSite(process.env.AUTH_COOKIE_SAME_SITE || "lax");
export const getAuthCookieMaxAge = () => {
  const parsedValue = Number(process.env.AUTH_COOKIE_MAX_AGE_MS);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_AUTH_COOKIE_MAX_AGE_MS;
};
export const getAuthCookieDomain = () => String(process.env.AUTH_COOKIE_DOMAIN || "").trim() || undefined;
export const isProductionEnvironment = () => process.env.NODE_ENV === "production";
export const getAuthCookieSecure = () =>
  parseBoolean(process.env.AUTH_COOKIE_SECURE, isProductionEnvironment() || getAuthCookieSameSite() === "none");
export const isCsrfProtectionEnabled = () =>
  parseBoolean(process.env.CSRF_PROTECTION_ENABLED, getAuthCookieSameSite() === "none");
export const allowInsecureLocalhostSameSiteNone = () =>
  parseBoolean(process.env.AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE, false);

export const validateAuthCookieConfiguration = () => {
  if (getAuthCookieSameSite() !== "none") {
    return;
  }

  if (!getAuthCookieSecure()) {
    throw new Error("AUTH_COOKIE_SAME_SITE=none requires AUTH_COOKIE_SECURE=true.");
  }

  if (!isProductionEnvironment() && !allowInsecureLocalhostSameSiteNone()) {
    throw new Error(
      "AUTH_COOKIE_SAME_SITE=none requires HTTPS. Use production HTTPS or set AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE=true only for explicit localhost testing."
    );
  }
};

const buildCookieOptions = ({ httpOnly }) => ({
  httpOnly,
  sameSite: getAuthCookieSameSite(),
  secure: getAuthCookieSecure(),
  path: "/",
  maxAge: getAuthCookieMaxAge(),
  ...(getAuthCookieDomain() ? { domain: getAuthCookieDomain() } : {})
});

const buildClearedCookieOptions = () => ({
  sameSite: getAuthCookieSameSite(),
  secure: getAuthCookieSecure(),
  path: "/",
  ...(getAuthCookieDomain() ? { domain: getAuthCookieDomain() } : {})
});

export const readRequestCookie = (req, cookieName) => {
  const parsedCookies = parseCookieHeader(req?.headers?.cookie || "");

  return parsedCookies[cookieName] || "";
};

export const setAuthCookie = (res, token) => {
  res.cookie(getAuthCookieName(), token, buildCookieOptions({ httpOnly: true }));
};

export const setCsrfCookie = (res, csrfToken) => {
  if (!isCsrfProtectionEnabled()) {
    return;
  }

  res.cookie(getCsrfCookieName(), csrfToken, buildCookieOptions({ httpOnly: false }));
};

export const ensureCsrfCookie = (req, res) => {
  if (!isCsrfProtectionEnabled()) {
    return "";
  }

  const existingToken = readRequestCookie(req, getCsrfCookieName());
  const csrfToken = existingToken || crypto.randomBytes(32).toString("hex");

  setCsrfCookie(res, csrfToken);

  return csrfToken;
};

export const applyAuthenticationCookies = (req, res, token) => {
  setAuthCookie(res, token);
  ensureCsrfCookie(req, res);
};

export const clearAuthenticationCookies = (res) => {
  res.clearCookie(getAuthCookieName(), buildClearedCookieOptions());
  res.clearCookie(getCsrfCookieName(), buildClearedCookieOptions());
};
