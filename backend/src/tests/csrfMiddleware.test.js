import { afterEach, describe, expect, it, vi } from "vitest";
import { csrfProtection } from "../middleware/csrfMiddleware.js";

const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: null,
    status: vi.fn((code) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((payload) => {
      response.payload = payload;
      return response;
    })
  };

  return response;
};

describe("csrf middleware", () => {
  const originalFlag = process.env.CSRF_PROTECTION_ENABLED;

  afterEach(() => {
    process.env.CSRF_PROTECTION_ENABLED = originalFlag;
  });

  it("rejects state-changing requests without a matching csrf header when protection is enabled", () => {
    process.env.CSRF_PROTECTION_ENABLED = "true";
    const response = createResponse();

    csrfProtection(
      {
        method: "POST",
        headers: {
          cookie: "pasali_auth=session-token; pasali_csrf=known-token"
        }
      },
      response,
      vi.fn()
    );

    expect(response.statusCode).toBe(403);
    expect(response.payload).toEqual({
      success: false,
      message: "CSRF token is missing or invalid."
    });
  });

  it("allows matching csrf tokens and safe methods", () => {
    process.env.CSRF_PROTECTION_ENABLED = "true";
    const protectedNext = vi.fn();
    const safeNext = vi.fn();

    csrfProtection(
      {
        method: "DELETE",
        headers: {
          cookie: "pasali_auth=session-token; pasali_csrf=known-token",
          "x-csrf-token": "known-token"
        }
      },
      createResponse(),
      protectedNext
    );

    csrfProtection(
      {
        method: "GET",
        headers: {
          cookie: "pasali_auth=session-token"
        }
      },
      createResponse(),
      safeNext
    );

    expect(protectedNext).toHaveBeenCalled();
    expect(safeNext).toHaveBeenCalled();
  });
});
