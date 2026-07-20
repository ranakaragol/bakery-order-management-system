import { describe, expect, it, vi } from "vitest";
import {
  RATE_LIMIT_MAX_REQUESTS,
  apiRateLimit,
  authLoginRateLimit,
  authRegisterRateLimit
} from "../middleware/securityMiddleware.js";

const createRequest = ({ ip, method = "GET", path = "/api/test" }) => ({
  ip,
  method,
  path,
  originalUrl: path,
  headers: {},
  body: {},
  socket: {
    remoteAddress: ip
  },
  app: {
    get: vi.fn().mockReturnValue(false)
  }
});

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader: vi.fn((name, value) => {
      response.headers[name.toLowerCase()] = value;
    }),
    getHeader: vi.fn((name) => response.headers[name.toLowerCase()]),
    status: vi.fn((code) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((payload) => {
      response.body = payload;
      return response;
    })
  };

  return response;
};

const runRateLimit = async (middleware, request) => {
  const response = createResponse();
  const next = vi.fn();

  await middleware(request, response, next);

  return {
    response,
    next
  };
};

describe("security middleware", () => {
  it("limits repeated login attempts with a 429 response", async () => {
    const ip = "127.0.0.11";
    for (let index = 0; index < RATE_LIMIT_MAX_REQUESTS.authLogin; index += 1) {
      const attempt = await runRateLimit(authLoginRateLimit, createRequest({
        ip,
        method: "POST",
        path: "/api/auth/login"
      }));

      expect(attempt.next).toHaveBeenCalled();
      expect(attempt.response.statusCode).toBe(200);
    }

    const limitedResponse = await runRateLimit(authLoginRateLimit, createRequest({
      ip,
      method: "POST",
      path: "/api/auth/login"
    }));

    expect(limitedResponse.response.statusCode).toBe(429);
    expect(limitedResponse.response.body).toEqual({
      success: false,
      message: "Çok fazla giriş denemesi yaptınız. Lütfen daha sonra tekrar deneyin."
    });
  });

  it("limits repeated register attempts with a 429 response", async () => {
    const ip = "127.0.0.12";
    for (let index = 0; index < RATE_LIMIT_MAX_REQUESTS.authRegister; index += 1) {
      const attempt = await runRateLimit(authRegisterRateLimit, createRequest({
        ip,
        method: "POST",
        path: "/api/auth/register"
      }));

      expect(attempt.next).toHaveBeenCalled();
      expect(attempt.response.statusCode).toBe(200);
    }

    const limitedResponse = await runRateLimit(authRegisterRateLimit, createRequest({
      ip,
      method: "POST",
      path: "/api/auth/register"
    }));

    expect(limitedResponse.response.statusCode).toBe(429);
    expect(limitedResponse.response.body).toEqual({
      success: false,
      message: "Kısa süre içinde çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin."
    });
  });

  it("keeps normal customer and admin requests working below the general API limit", async () => {
    const customerAttempt = await runRateLimit(apiRateLimit, createRequest({
      ip: "127.0.0.21",
      path: "/api/cart"
    }));
    const adminAttempt = await runRateLimit(apiRateLimit, createRequest({
      ip: "127.0.0.22",
      path: "/api/admin/dashboard"
    }));

    expect(customerAttempt.next).toHaveBeenCalled();
    expect(customerAttempt.response.statusCode).toBe(200);
    expect(customerAttempt.response.body).toBeUndefined();
    expect(adminAttempt.next).toHaveBeenCalled();
    expect(adminAttempt.response.statusCode).toBe(200);
    expect(adminAttempt.response.body).toBeUndefined();
  });
});
