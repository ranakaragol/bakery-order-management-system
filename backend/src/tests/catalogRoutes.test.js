import { describe, expect, it, vi } from "vitest";
import categoryRoutes from "../routes/categoryRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import { protect } from "../middleware/authMiddleware.js";
import { csrfProtection } from "../middleware/csrfMiddleware.js";

const findRouteStack = (router, path, method) =>
  router.stack.find((layer) => layer.route?.path === path && layer.route.methods?.[method])?.route?.stack || [];

const runRoleMiddleware = (middleware, role) => {
  const req = {
    user: {
      role
    }
  };
  const res = {
    status: vi.fn(),
    json: vi.fn()
  };
  const next = vi.fn();

  res.status.mockReturnValue(res);
  middleware(req, res, next);

  return {
    res,
    next
  };
};

describe("catalog routes", () => {
  it("keeps product listing endpoints public", () => {
    const listRoute = findRouteStack(productRoutes, "/", "get");
    const detailRoute = findRouteStack(productRoutes, "/:id", "get");

    expect(listRoute.length).toBe(1);
    expect(detailRoute.length).toBe(1);
    expect(listRoute.some((layer) => layer.handle === protect)).toBe(false);
    expect(detailRoute.some((layer) => layer.handle === protect)).toBe(false);
  });

  it("keeps category listing endpoint public", () => {
    const categoryRoute = findRouteStack(categoryRoutes, "/", "get");

    expect(categoryRoute.length).toBe(1);
    expect(categoryRoute.some((layer) => layer.handle === protect)).toBe(false);
  });

  it("keeps category creation admin-only", async () => {
    const createRoute = findRouteStack(categoryRoutes, "/", "post");
    const protectMiddleware = createRoute.find((layer) => layer.handle === protect)?.handle;
    const csrfMiddleware = createRoute.find((layer) => layer.handle === csrfProtection)?.handle;
    const roleMiddleware = createRoute[2]?.handle;
    const unauthenticatedResponse = {
      statusCode: 200,
      payload: null,
      status: vi.fn((code) => {
        unauthenticatedResponse.statusCode = code;
        return unauthenticatedResponse;
      }),
      json: vi.fn((payload) => {
        unauthenticatedResponse.payload = payload;
        return unauthenticatedResponse;
      })
    };

    expect(protectMiddleware).toBe(protect);
    expect(csrfMiddleware).toBe(csrfProtection);
    expect(typeof roleMiddleware).toBe("function");

    await protectMiddleware({ headers: {} }, unauthenticatedResponse, vi.fn());

    expect(unauthenticatedResponse.statusCode).toBe(401);
    expect(unauthenticatedResponse.payload).toEqual({
      success: false,
      message: "Authentication token is missing."
    });

    const customerRun = runRoleMiddleware(roleMiddleware, "customer");
    expect(customerRun.res.status).toHaveBeenCalledWith(403);
    expect(customerRun.res.json).toHaveBeenCalledWith({
      success: false,
      message: "You are not authorized for this action."
    });

    const adminRun = runRoleMiddleware(roleMiddleware, "admin");
    expect(adminRun.next).toHaveBeenCalled();
  });
});
