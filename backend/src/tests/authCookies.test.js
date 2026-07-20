import { afterEach, describe, expect, it } from "vitest";
import { validateAuthCookieConfiguration } from "../utils/authCookies.js";

describe("auth cookie configuration", () => {
  const originalEnv = {
    NODE_ENV: process.env.NODE_ENV,
    AUTH_COOKIE_SAME_SITE: process.env.AUTH_COOKIE_SAME_SITE,
    AUTH_COOKIE_SECURE: process.env.AUTH_COOKIE_SECURE,
    AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE: process.env.AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE
  };

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV;
    process.env.AUTH_COOKIE_SAME_SITE = originalEnv.AUTH_COOKIE_SAME_SITE;
    process.env.AUTH_COOKIE_SECURE = originalEnv.AUTH_COOKIE_SECURE;
    process.env.AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE = originalEnv.AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE;
  });

  it("rejects SameSite=None on non-production environments unless an explicit localhost override is set", () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_COOKIE_SAME_SITE = "none";
    delete process.env.AUTH_COOKIE_SECURE;
    delete process.env.AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE;

    expect(() => validateAuthCookieConfiguration()).toThrow(
      "AUTH_COOKIE_SAME_SITE=none requires HTTPS. Use production HTTPS or set AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE=true only for explicit localhost testing."
    );
  });

  it("allows explicit localhost override for SameSite=None testing", () => {
    process.env.NODE_ENV = "development";
    process.env.AUTH_COOKIE_SAME_SITE = "none";
    process.env.AUTH_COOKIE_SECURE = "true";
    process.env.AUTH_COOKIE_ALLOW_INSECURE_LOCALHOST_NONE = "true";

    expect(() => validateAuthCookieConfiguration()).not.toThrow();
  });
});
