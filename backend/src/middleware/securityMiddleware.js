import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponses.js";

export const RATE_LIMIT_WINDOWS = {
  authLoginMs: 15 * 60 * 1000,
  authRegisterMs: 60 * 60 * 1000,
  apiMs: 15 * 60 * 1000
};

export const RATE_LIMIT_MAX_REQUESTS = {
  authLogin: 10,
  authRegister: 5,
  api: 300
};

const createRateLimitHandler = (message) => (req, res) =>
  sendError(res, 429, {
    message
  });

const createRateLimit = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: createRateLimitHandler(message)
  });

export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});

export const apiRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_WINDOWS.apiMs,
  max: RATE_LIMIT_MAX_REQUESTS.api,
  message: "Çok fazla istek gönderdiniz. Lütfen kısa bir süre sonra tekrar deneyin."
});

export const authLoginRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_WINDOWS.authLoginMs,
  max: RATE_LIMIT_MAX_REQUESTS.authLogin,
  message: "Çok fazla giriş denemesi yaptınız. Lütfen daha sonra tekrar deneyin."
});

export const authRegisterRateLimit = createRateLimit({
  windowMs: RATE_LIMIT_WINDOWS.authRegisterMs,
  max: RATE_LIMIT_MAX_REQUESTS.authRegister,
  message: "Kısa süre içinde çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin."
});
