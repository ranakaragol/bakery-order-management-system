import { CSRF_HEADER_NAME, SAFE_HTTP_METHODS } from "../../../shared/auth.js";
import { sendError } from "../utils/apiResponses.js";
import {
  getAuthCookieName,
  getCsrfCookieName,
  isCsrfProtectionEnabled,
  readRequestCookie
} from "../utils/authCookies.js";

const safeMethods = new Set(SAFE_HTTP_METHODS);

export const csrfProtection = (req, res, next) => {
  if (!isCsrfProtectionEnabled() || safeMethods.has(req.method)) {
    return next();
  }

  const authCookie = readRequestCookie(req, getAuthCookieName());

  if (!authCookie) {
    return next();
  }

  const cookieToken = readRequestCookie(req, getCsrfCookieName());
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return sendError(res, 403, { message: "CSRF token is missing or invalid." });
  }

  return next();
};
