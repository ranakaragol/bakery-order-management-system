import { validationResult } from "express-validator";
import { describe, expect, it } from "vitest";
import { protect } from "../middleware/authMiddleware.js";
import profileRoutes from "../routes/profileRoutes.js";
import { profilePasswordValidator, profileValidator } from "../validators/authValidators.js";
import {
  createEmptyBillingAddress,
  hasCompleteBillingAddress,
  isValidProfilePhone,
  normalizeBillingAddress
} from "../../../shared/profile.js";

const findRouteStack = (router, path, method) =>
  router.stack.find((layer) => layer.route?.path === path && layer.route.methods?.[method])?.route?.stack || [];

const runValidators = async (validators, body) => {
  const req = { body: { ...body } };

  for (const validator of validators) {
    await validator.run(req);
  }

  return validationResult(req);
};

describe("profile helpers", () => {
  it("normalizes and validates billing address completeness", () => {
    const emptyAddress = createEmptyBillingAddress();
    const completedAddress = normalizeBillingAddress({
      fullName: "Rana Karagöl",
      companyName: "Paşalı Patiserrie",
      taxOffice: "Kadıköy",
      taxNumber: "1234567890",
      email: "rana@example.com",
      phone: "05321234567",
      billingAddress: "Bağdat Caddesi No:10 Daire:3 Kadıköy / İstanbul"
    });

    expect(hasCompleteBillingAddress(emptyAddress)).toBe(false);
    expect(hasCompleteBillingAddress(completedAddress)).toBe(true);
    expect(isValidProfilePhone("05321234567")).toBe(true);
    expect(isValidProfilePhone("123")).toBe(false);
  });
});

describe("profile validators", () => {
  it("accepts valid profile updates", async () => {
    const errors = await runValidators(profileValidator, {
      firstName: "Rana",
      lastName: "Karagöl",
      email: "rana@example.com",
      phone: "05321234567",
      address: "Teslimat adresi",
      billingAddress: {
        email: "rana@example.com",
        phone: "05321234567"
      }
    });

    expect(errors.isEmpty()).toBe(true);
  });

  it("rejects invalid phone values and short passwords", async () => {
    const profileErrors = await runValidators(profileValidator, {
      phone: "12"
    });
    const passwordErrors = await runValidators(profilePasswordValidator, {
      currentPassword: "12345678",
      newPassword: "1234567"
    });

    expect(profileErrors.isEmpty()).toBe(false);
    expect(passwordErrors.isEmpty()).toBe(false);
  });
});

describe("profile routes", () => {
  it("keeps profile endpoints protected", () => {
    const getRoute = findRouteStack(profileRoutes, "/", "get");
    const putRoute = findRouteStack(profileRoutes, "/", "put");
    const passwordRoute = findRouteStack(profileRoutes, "/password", "put");
    const middlewareStack = profileRoutes.stack.filter((layer) => !layer.route);

    expect(middlewareStack.some((layer) => layer.handle === protect)).toBe(true);
    expect(getRoute.length).toBeGreaterThan(0);
    expect(putRoute.length).toBeGreaterThan(0);
    expect(passwordRoute.length).toBeGreaterThan(0);
  });
});
