import { afterEach, describe, expect, it, vi } from "vitest";
import { errorHandler } from "../middleware/errorMiddleware.js";

const createResponse = () => {
  const response = {
    statusCode: 200,
    body: undefined,
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

const runErrorHandler = (error) => {
  const response = createResponse();

  errorHandler(error, { method: "GET", originalUrl: "/test" }, response, vi.fn());

  return response;
};

describe("error middleware", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("returns 409 for duplicate customer email registrations", async () => {
    const response = runErrorHandler({
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: "rana@example.com" }
    });

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "Bu e-posta adresi zaten kullanımda.",
      field: "email"
    });
  });

  it("returns 409 for duplicate category names, category slugs and product slugs", async () => {
    const categoryResponse = runErrorHandler({
      code: 11000,
      keyPattern: { name: 1 },
      keyValue: { name: "Pasta" }
    });
    const categorySlugResponse = runErrorHandler({
      code: 11000,
      keyPattern: { slug: 1 },
      keyValue: { slug: "pastalar" }
    });
    const productResponse = runErrorHandler({
      code: 11000,
      keyPattern: { slug: 1 },
      keyValue: { slug: "profiterol" }
    });

    expect(categoryResponse.statusCode).toBe(409);
    expect(categoryResponse.body).toEqual({
      success: false,
      message: "Bu isim zaten kullanımda.",
      field: "name"
    });
    expect(categorySlugResponse.statusCode).toBe(409);
    expect(categorySlugResponse.body).toEqual({
      success: false,
      message: "Bu slug zaten kullanımda.",
      field: "slug"
    });
    expect(productResponse.statusCode).toBe(409);
    expect(productResponse.body).toEqual({
      success: false,
      message: "Bu slug zaten kullanımda.",
      field: "slug"
    });
  });

  it("hides stack traces in production error responses", async () => {
    process.env.NODE_ENV = "production";

    const response = runErrorHandler(new Error("Sensitive database failure"));

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "Unexpected server error."
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.stack).toBeUndefined();
  });
});
