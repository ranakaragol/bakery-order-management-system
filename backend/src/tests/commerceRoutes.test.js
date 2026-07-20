import { describe, expect, it, vi } from "vitest";
import cartRoutes from "../routes/cartRoutes.js";
import orderRoutes from "../routes/orderRoutes.js";
import { protect } from "../middleware/authMiddleware.js";

const findRouteStack = (router, path, method) =>
  router.stack.find((layer) => layer.route?.path === path && layer.route.methods?.[method])?.route?.stack || [];

const getRouterMiddleware = (router) => router.stack.filter((layer) => !layer.route);

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

describe("commerce routes", () => {
  it("keeps customer cart endpoints protected and rejects admin users", () => {
    const middlewareStack = getRouterMiddleware(cartRoutes);
    const roleMiddleware = middlewareStack[middlewareStack.length - 1]?.handle;
    const listRoute = findRouteStack(cartRoutes, "/", "get");
    const createRoute = findRouteStack(cartRoutes, "/items", "post");

    expect(middlewareStack[0]?.handle).toBe(protect);
    expect(typeof roleMiddleware).toBe("function");
    expect(listRoute.length).toBe(1);
    expect(createRoute.length).toBeGreaterThan(0);

    const adminRun = runRoleMiddleware(roleMiddleware, "admin");
    expect(adminRun.res.status).toHaveBeenCalledWith(403);
    expect(adminRun.res.json).toHaveBeenCalledWith({
      success: false,
      message: "You are not authorized for this action."
    });

    const customerRun = runRoleMiddleware(roleMiddleware, "customer");
    expect(customerRun.next).toHaveBeenCalled();
  });

  it("keeps customer order endpoints protected and rejects admin users", () => {
    const middlewareStack = getRouterMiddleware(orderRoutes);
    const roleMiddleware = middlewareStack[middlewareStack.length - 1]?.handle;
    const listRoute = findRouteStack(orderRoutes, "/my", "get");
    const createRoute = findRouteStack(orderRoutes, "/", "post");

    expect(middlewareStack[0]?.handle).toBe(protect);
    expect(typeof roleMiddleware).toBe("function");
    expect(listRoute.length).toBe(1);
    expect(createRoute.length).toBeGreaterThan(0);

    const adminRun = runRoleMiddleware(roleMiddleware, "admin");
    expect(adminRun.res.status).toHaveBeenCalledWith(403);
    expect(adminRun.res.json).toHaveBeenCalledWith({
      success: false,
      message: "You are not authorized for this action."
    });

    const customerRun = runRoleMiddleware(roleMiddleware, "customer");
    expect(customerRun.next).toHaveBeenCalled();
  });
});
