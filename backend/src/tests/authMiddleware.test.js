import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  userFindById: vi.fn()
}));

vi.mock("../models/User.js", () => ({
  default: {
    findById: mocks.userFindById
  }
}));

const { allowRoles, protect } = await import("../middleware/authMiddleware.js");
const { logout } = await import("../controllers/authController.js");

const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: null,
    clearedCookies: [],
    status: vi.fn((code) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((payload) => {
      response.payload = payload;
      return response;
    }),
    clearCookie: vi.fn((name, options) => {
      response.clearedCookies.push({ name, options });
      return response;
    })
  };

  return response;
};

const createProtectedUserQuery = (user) => ({
  populate: vi.fn().mockResolvedValue(user)
});

describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
  });

  it("allows auth/me-equivalent access with a valid auth cookie", async () => {
    const token = jwt.sign({ userId: "user-1", role: "customer" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const req = {
      headers: {
        cookie: `pasali_auth=${token}`
      }
    };
    const res = createResponse();
    const next = vi.fn();
    mocks.userFindById.mockReturnValue(
      createProtectedUserQuery({
        _id: "user-1",
        role: "customer"
      })
    );

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(
      expect.objectContaining({
        _id: "user-1",
        role: "customer"
      })
    );
  });

  it("rejects protected routes without an auth cookie", async () => {
    const res = createResponse();

    await protect({ headers: {} }, res, vi.fn());

    expect(res.statusCode).toBe(401);
    expect(res.payload).toEqual({
      success: false,
      message: "Authentication token is missing."
    });
  });

  it("rejects protected routes after logout clears the session cookies", async () => {
    const logoutResponse = createResponse();
    const protectedResponse = createResponse();

    await logout({ headers: {} }, logoutResponse, vi.fn());
    await protect({ headers: {} }, protectedResponse, vi.fn());

    expect(logoutResponse.clearedCookies).toHaveLength(2);
    expect(protectedResponse.statusCode).toBe(401);
    expect(protectedResponse.payload).toEqual({
      success: false,
      message: "Authentication token is missing."
    });
  });

  it("rejects invalid and expired cookies with a 401 response", async () => {
    const invalidResponse = createResponse();
    const expiredResponse = createResponse();
    const expiredToken = jwt.sign({ userId: "user-1", role: "customer" }, process.env.JWT_SECRET, { expiresIn: -1 });

    await protect(
      {
        headers: {
          cookie: "pasali_auth=invalid-token"
        }
      },
      invalidResponse,
      vi.fn()
    );

    await protect(
      {
        headers: {
          cookie: `pasali_auth=${expiredToken}`
        }
      },
      expiredResponse,
      vi.fn()
    );

    expect(invalidResponse.statusCode).toBe(401);
    expect(expiredResponse.statusCode).toBe(401);
    expect(invalidResponse.payload.message).toBe("Authentication failed.");
    expect(expiredResponse.payload.message).toBe("Authentication failed.");
    expect(invalidResponse.clearedCookies).toHaveLength(2);
    expect(expiredResponse.clearedCookies).toHaveLength(2);
  });

  it("keeps customer and admin role checks working", () => {
    const adminResponse = createResponse();
    const customerNext = vi.fn();
    const adminNext = vi.fn();
    const customerGuard = allowRoles("customer");

    customerGuard({ user: { role: "customer" } }, createResponse(), customerNext);
    customerGuard({ user: { role: "admin" } }, adminResponse, adminNext);

    expect(customerNext).toHaveBeenCalled();
    expect(adminResponse.statusCode).toBe(403);
    expect(adminResponse.payload).toEqual({
      success: false,
      message: "You are not authorized for this action."
    });
  });
});
