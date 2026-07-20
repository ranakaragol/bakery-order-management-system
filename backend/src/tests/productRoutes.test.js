import jwt from "jsonwebtoken";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CSRF_HEADER_NAME,
  DEFAULT_AUTH_COOKIE_NAME,
  DEFAULT_CSRF_COOKIE_NAME
} from "../../../shared/auth.js";

const mocks = vi.hoisted(() => ({
  userFindById: vi.fn(),
  getProducts: vi.fn((req, res) => res.json({ ok: true, route: "list" })),
  getProductById: vi.fn((req, res) => res.json({ ok: true, route: "detail" })),
  getAdminProducts: vi.fn((req, res) => res.json({ ok: true, route: "admin" })),
  createProduct: vi.fn((req, res) => res.status(201).json({ ok: true, route: "create" })),
  updateProduct: vi.fn((req, res) => res.json({ ok: true, route: "update" })),
  deleteProduct: vi.fn((req, res) => res.json({ ok: true, route: "delete" }))
}));

vi.mock("../models/User.js", () => ({
  default: {
    findById: mocks.userFindById
  }
}));

vi.mock("../controllers/productController.js", () => ({
  createProduct: mocks.createProduct,
  deleteProduct: mocks.deleteProduct,
  getAdminProducts: mocks.getAdminProducts,
  getProductById: mocks.getProductById,
  getProducts: mocks.getProducts,
  updateProduct: mocks.updateProduct
}));

vi.mock("../validators/catalogValidators.js", () => ({
  productValidator: [(req, res, next) => next()]
}));

const productRoutes = (await import("../routes/productRoutes.js")).default;

const originalJwtSecret = process.env.JWT_SECRET;
const originalCsrfFlag = process.env.CSRF_PROTECTION_ENABLED;

const createUserQuery = (role) => ({
  populate: vi.fn().mockResolvedValue({
    _id: `${role}-1`,
    role
  })
});

const signAuthCookie = (role = "admin") =>
  `${DEFAULT_AUTH_COOKIE_NAME}=${jwt.sign({ userId: `${role}-1`, role }, process.env.JWT_SECRET, {
    expiresIn: "1h"
  })}`;

const findRouteStack = (path, method) =>
  productRoutes.stack.find((layer) => layer.route?.path === path && layer.route.methods?.[method])?.route?.stack || [];

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

const runRouteStack = async (stack, req = {}) => {
  const response = createResponse();
  const request = {
    method: "GET",
    headers: {},
    params: {},
    body: {},
    ...req
  };
  let index = 0;

  const dispatch = async () => {
    const layer = stack[index++];

    if (!layer) {
      return response;
    }

    let nextCalled = false;
    let nextError;

    await layer.handle(request, response, (error) => {
      nextCalled = true;
      nextError = error;
    });

    if (nextError) {
      throw nextError;
    }

    if (nextCalled) {
      return dispatch();
    }

    return response;
  };

  await dispatch();

  return response;
};

describe("product routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    process.env.CSRF_PROTECTION_ENABLED = "true";
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.CSRF_PROTECTION_ENABLED = originalCsrfFlag;
  });

  it("keeps public GET product endpoints working without CSRF headers", async () => {
    const listResponse = await runRouteStack(findRouteStack("/", "get"));
    const detailResponse = await runRouteStack(findRouteStack("/:id", "get"), {
      params: { id: "product-1" }
    });

    expect(listResponse.statusCode).toBe(200);
    expect(detailResponse.statusCode).toBe(200);
    expect(mocks.getProducts).toHaveBeenCalled();
    expect(mocks.getProductById).toHaveBeenCalled();
  });

  it("rejects admin product creation without a CSRF header when auth cookie is present", async () => {
    mocks.userFindById.mockReturnValue(createUserQuery("admin"));

    const response = await runRouteStack(findRouteStack("/", "post"), {
      method: "POST",
      headers: {
        cookie: `${signAuthCookie("admin")}; ${DEFAULT_CSRF_COOKIE_NAME}=csrf-token`
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.payload).toEqual({
      success: false,
      message: "CSRF token is missing or invalid."
    });
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("rejects admin product writes with a mismatched CSRF token", async () => {
    mocks.userFindById.mockReturnValue(createUserQuery("admin"));

    const response = await runRouteStack(findRouteStack("/", "post"), {
      method: "POST",
      headers: {
        cookie: `${signAuthCookie("admin")}; ${DEFAULT_CSRF_COOKIE_NAME}=csrf-cookie-value`,
        [CSRF_HEADER_NAME]: "csrf-header-value"
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.payload).toEqual({
      success: false,
      message: "CSRF token is missing or invalid."
    });
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("allows admin POST, PUT and DELETE product routes with a valid CSRF cookie/header pair", async () => {
    mocks.userFindById.mockReturnValue(createUserQuery("admin"));
    const cookieHeader = `${signAuthCookie("admin")}; ${DEFAULT_CSRF_COOKIE_NAME}=valid-csrf-token`;
    const requestHeaders = {
      cookie: cookieHeader,
      [CSRF_HEADER_NAME]: "valid-csrf-token"
    };

    const postResponse = await runRouteStack(findRouteStack("/", "post"), {
      method: "POST",
      headers: requestHeaders
    });
    const putResponse = await runRouteStack(findRouteStack("/:id", "put"), {
      method: "PUT",
      params: { id: "product-1" },
      headers: requestHeaders
    });
    const deleteResponse = await runRouteStack(findRouteStack("/:id", "delete"), {
      method: "DELETE",
      params: { id: "product-1" },
      headers: requestHeaders
    });

    expect(postResponse.statusCode).toBe(201);
    expect(putResponse.statusCode).toBe(200);
    expect(deleteResponse.statusCode).toBe(200);
    expect(mocks.createProduct).toHaveBeenCalled();
    expect(mocks.updateProduct).toHaveBeenCalled();
    expect(mocks.deleteProduct).toHaveBeenCalled();
  });

  it("keeps customer users blocked from admin product writes before the CSRF check", async () => {
    mocks.userFindById.mockReturnValue(createUserQuery("customer"));

    const response = await runRouteStack(findRouteStack("/", "post"), {
      method: "POST",
      headers: {
        cookie: signAuthCookie("customer")
      }
    });

    expect(response.statusCode).toBe(403);
    expect(response.payload).toEqual({
      success: false,
      message: "You are not authorized for this action."
    });
    expect(mocks.createProduct).not.toHaveBeenCalled();
  });

  it("keeps local development behavior unchanged when CSRF protection is disabled", async () => {
    process.env.CSRF_PROTECTION_ENABLED = "false";
    mocks.userFindById.mockReturnValue(createUserQuery("admin"));

    const response = await runRouteStack(findRouteStack("/", "post"), {
      method: "POST",
      headers: {
        cookie: signAuthCookie("admin")
      }
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.createProduct).toHaveBeenCalled();
  });
});
