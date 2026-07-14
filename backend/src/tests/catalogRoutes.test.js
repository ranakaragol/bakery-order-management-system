import { describe, expect, it } from "vitest";
import categoryRoutes from "../routes/categoryRoutes.js";
import productRoutes from "../routes/productRoutes.js";
import { protect } from "../middleware/authMiddleware.js";

const findRouteStack = (router, path, method) =>
  router.stack.find((layer) => layer.route?.path === path && layer.route.methods?.[method])?.route?.stack || [];

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
});
