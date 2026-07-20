import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_AUTH_COOKIE_NAME, DEFAULT_CSRF_COOKIE_NAME } from "../../../shared/auth.js";

const mocks = vi.hoisted(() => ({
  userFindOne: vi.fn(),
  userCreate: vi.fn(),
  userFindById: vi.fn(),
  generateToken: vi.fn()
}));

vi.mock("../models/User.js", () => ({
  default: {
    findOne: mocks.userFindOne,
    create: mocks.userCreate,
    findById: mocks.userFindById
  }
}));

vi.mock("../models/InvoiceInfo.js", () => ({
  default: {}
}));

vi.mock("../utils/generateToken.js", () => ({
  generateToken: mocks.generateToken
}));

const { login, logout, register } = await import("../controllers/authController.js");

const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: null,
    cookies: [],
    clearedCookies: [],
    status: vi.fn((code) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((payload) => {
      response.payload = payload;
      return response;
    }),
    cookie: vi.fn((name, value, options) => {
      response.cookies.push({ name, value, options });
      return response;
    }),
    clearCookie: vi.fn((name, options) => {
      response.clearedCookies.push({ name, options });
      return response;
    })
  };

  return response;
};

const createUser = (overrides = {}) => ({
  _id: "user-1",
  firstName: "Rana",
  lastName: "Karagöl",
  email: "rana@example.com",
  phone: "05321234567",
  address: "Moda Caddesi, Kadıköy / İstanbul",
  deliveryAddress: {
    addressTitle: "Ev",
    province: "istanbul",
    district: "kadikoy",
    neighborhood: "Caferağa Mahallesi",
    streetAddress: "Moda Caddesi",
    postalCode: "34710"
  },
  billingAddress: {
    fullName: "",
    companyName: "",
    taxOffice: "",
    taxNumber: "",
    email: "",
    phone: "",
    billingAddress: ""
  },
  role: "customer",
  invoiceInfo: null,
  createdAt: "2026-07-20T10:00:00.000Z",
  updatedAt: "2026-07-20T10:00:00.000Z",
  comparePassword: vi.fn().mockResolvedValue(true),
  ...overrides
});

const createLoginQuery = (user) => ({
  select: vi.fn().mockReturnValue({
    populate: vi.fn().mockResolvedValue(user)
  })
});

const createFindByIdQuery = (user) => ({
  populate: vi.fn().mockResolvedValue(user)
});

describe("auth controller", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.CSRF_PROTECTION_ENABLED;
    mocks.generateToken.mockReturnValue("signed.jwt.token");
  });

  it("returns 409 when the email address is already registered", async () => {
    mocks.userFindOne.mockResolvedValue({ _id: "existing-user" });
    const response = createResponse();

    await register(
      {
        body: {
          firstName: "Rana",
          lastName: "Karagöl",
          email: "rana@example.com",
          password: "12345678",
          phone: "05321234567",
          deliveryAddress: {
            province: "istanbul",
            district: "kadikoy",
            neighborhood: "Caferağa Mahallesi",
            streetAddress: "Moda Caddesi"
          }
        },
        headers: {}
      },
      response,
      vi.fn()
    );

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      message: "Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var."
    });
  });

  it("creates an HttpOnly auth cookie on successful login and does not leak the token in the body", async () => {
    const user = createUser();
    mocks.userFindOne.mockReturnValue(createLoginQuery(user));
    const response = createResponse();

    await login(
      {
        body: {
          email: "rana@example.com",
          password: "12345678"
        },
        headers: {}
      },
      response,
      vi.fn()
    );

    expect(response.cookies).toHaveLength(1);
    expect(response.cookies[0]).toEqual(
      expect.objectContaining({
        name: DEFAULT_AUTH_COOKIE_NAME,
        value: "signed.jwt.token",
        options: expect.objectContaining({
          httpOnly: true,
          path: "/",
          sameSite: "lax"
        })
      })
    );
    expect(response.payload).toEqual(
      expect.objectContaining({
        message: "Giriş başarılı.",
        user: expect.objectContaining({
          email: "rana@example.com"
        })
      })
    );
    expect(response.payload.token).toBeUndefined();
  });

  it("sets a secure auth cookie in production", async () => {
    process.env.NODE_ENV = "production";
    const user = createUser();
    mocks.userFindOne.mockReturnValue(createLoginQuery(user));
    const response = createResponse();

    await login(
      {
        body: {
          email: "rana@example.com",
          password: "12345678"
        },
        headers: {}
      },
      response,
      vi.fn()
    );

    expect(response.cookies[0].options.secure).toBe(true);
  });

  it("does not leak the token in the register response body and can set a csrf cookie when protection is enabled", async () => {
    process.env.CSRF_PROTECTION_ENABLED = "true";
    const user = createUser();
    mocks.userFindOne.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({ _id: user._id, role: user.role });
    mocks.userFindById.mockReturnValue(createFindByIdQuery(user));
    const response = createResponse();

    await register(
      {
        body: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: "12345678",
          phone: user.phone,
          deliveryAddress: user.deliveryAddress
        },
        headers: {}
      },
      response,
      vi.fn()
    );

    expect(response.statusCode).toBe(201);
    expect(response.payload.token).toBeUndefined();
    expect(response.cookies.map((cookie) => cookie.name)).toEqual([DEFAULT_AUTH_COOKIE_NAME, DEFAULT_CSRF_COOKIE_NAME]);
    expect(response.cookies[1].options.httpOnly).toBe(false);
  });

  it("clears auth cookies on logout", async () => {
    const response = createResponse();

    await logout({ headers: {} }, response, vi.fn());

    expect(response.clearedCookies.map((cookie) => cookie.name)).toEqual([
      DEFAULT_AUTH_COOKIE_NAME,
      DEFAULT_CSRF_COOKIE_NAME
    ]);
    expect(response.payload).toEqual({
      message: "Çıkış başarılı."
    });
  });
});
