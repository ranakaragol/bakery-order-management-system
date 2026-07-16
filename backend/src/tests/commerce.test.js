import { validationResult } from "express-validator";
import { describe, expect, it } from "vitest";
import {
  DELIVERY_FEE,
  calculateDeliveryFee,
  calculateLineTotal,
  calculateOrderTotal,
  decrementQuantity,
  incrementQuantity,
  isKilogramUnit,
  isValidQuantityForUnit,
  normalizeQuantity,
  sanitizeQuantity
} from "../../../shared/commerce.js";
import {
  addToCartValidator,
  createOrderValidator,
  updateCartItemValidator
} from "../validators/commerceValidators.js";
import { buildInstagramHref, PASALI_INSTAGRAM_URL } from "../../../frontend/src/utils/contactLinks.js";

const runValidators = async (validators, body) => {
  const req = { body: { ...body } };

  for (const validator of validators) {
    await validator.run(req);
  }

  return {
    req,
    errors: validationResult(req)
  };
};

describe("commerce helpers", () => {
  it("supports decimal kilogram quantities without floating point artifacts", () => {
    const firstStep = incrementQuantity(1, "Kg");
    const secondStep = incrementQuantity(firstStep, "KG");
    const fourthStep = incrementQuantity(incrementQuantity(secondStep, "kg"), "kg");
    const previousStep = decrementQuantity(fourthStep, "kg");

    expect(isKilogramUnit("Kg")).toBe(true);
    expect(firstStep).toBe(1.1);
    expect(secondStep).toBe(1.2);
    expect(fourthStep).toBe(1.4);
    expect(previousStep).toBe(1.3);
    expect(normalizeQuantity(0.1 + 0.2, "kg")).toBe(0.3);
    expect(isValidQuantityForUnit(1.4, "kg")).toBe(true);
    expect(sanitizeQuantity("1,5")).toBe(1.5);
    expect(normalizeQuantity("1,5", "kg")).toBe(1.5);
    expect(isValidQuantityForUnit("1,5", "kg")).toBe(true);
  });

  it("keeps non-kilogram quantities as integers", () => {
    expect(normalizeQuantity(2.7, "Adet")).toBe(3);
    expect(isValidQuantityForUnit(3, "Tepsi")).toBe(true);
    expect(isValidQuantityForUnit(1.4, "Adet")).toBe(false);
    expect(isValidQuantityForUnit("1,5", "Adet")).toBe(false);
  });

  it("calculates kilogram line totals and keeps delivery free", () => {
    const lineTotal = calculateLineTotal(380, 1.4);
    const deliveryFee = calculateDeliveryFee(532);
    const totalAmount = calculateOrderTotal(lineTotal, deliveryFee);

    expect(lineTotal).toBe(532);
    expect(deliveryFee).toBe(DELIVERY_FEE);
    expect(totalAmount).toBe(532);
  });
});

describe("contact links", () => {
  it("builds the canonical instagram URL", () => {
    expect(buildInstagramHref("instagram.com/toptanpastacin")).toBe(PASALI_INSTAGRAM_URL);
    expect(buildInstagramHref(PASALI_INSTAGRAM_URL)).toBe(PASALI_INSTAGRAM_URL);
  });
});

describe("commerce validators", () => {
  it("accepts kilogram quantities for add-to-cart payloads", async () => {
    const firstResult = await runValidators(addToCartValidator, {
      productId: "kg-product",
      quantity: 1.5
    });
    const secondResult = await runValidators(addToCartValidator, {
      productId: "kg-product",
      quantity: "0,5"
    });

    expect(firstResult.errors.isEmpty()).toBe(true);
    expect(firstResult.req.body.quantity).toBe(1.5);
    expect(secondResult.errors.isEmpty()).toBe(true);
    expect(secondResult.req.body.quantity).toBe(0.5);
  });

  it("rejects invalid quantities and still accepts integer unit payloads", async () => {
    const invalidUpdate = await runValidators(updateCartItemValidator, { quantity: 0 });
    const invalidAdd = await runValidators(addToCartValidator, {
      productId: "adet-product",
      quantity: "1,5a"
    });
    const validAdd = await runValidators(addToCartValidator, {
      productId: "adet-product",
      quantity: 2
    });

    expect(invalidUpdate.errors.isEmpty()).toBe(false);
    expect(invalidAdd.errors.isEmpty()).toBe(false);
    expect(validAdd.errors.isEmpty()).toBe(true);
    expect(validAdd.req.body.quantity).toBe(2);
  });

  it("accepts kilogram quantity updates", async () => {
    const response = await runValidators(updateCartItemValidator, { quantity: 1.4 });

    expect(response.errors.isEmpty()).toBe(true);
    expect(response.req.body.quantity).toBe(1.4);
  });

  it("requires delivery province, district and a valid payment method for checkout", async () => {
    const validPayload = await runValidators(createOrderValidator, {
      deliveryAddress: {
        province: "istanbul",
        district: "besiktas",
        neighborhood: "Levent Mahallesi",
        streetAddress: "Levent Mahallesi"
      },
      notes: "Kapıyı çalınız.",
      paymentMethod: "bank_transfer",
      invoiceInfo: {
        fullName: "Rana Karagöl",
        companyName: "Paşalı Patiserrie",
        taxNumber: "1234567890",
        taxOffice: "Kadıköy",
        billingAddress: "İstanbul",
        phone: "05321234567",
        email: "rana@example.com"
      }
    });
    const missingDistrictPayload = await runValidators(createOrderValidator, {
      deliveryAddress: {
        province: "istanbul",
        district: "",
        neighborhood: "Levent Mahallesi",
        streetAddress: "Levent Mahallesi"
      },
      notes: "Kapıyı çalınız.",
      paymentMethod: "bank_transfer",
      invoiceInfo: {
        fullName: "Rana Karagöl",
        companyName: "Paşalı Patiserrie",
        taxNumber: "1234567890",
        taxOffice: "Kadıköy",
        billingAddress: "İstanbul",
        phone: "05321234567",
        email: "rana@example.com"
      }
    });
    const invalidDistrictPairPayload = await runValidators(createOrderValidator, {
      deliveryAddress: {
        province: "istanbul",
        district: "izmit",
        neighborhood: "Levent Mahallesi",
        streetAddress: "Levent Mahallesi"
      },
      notes: "Kapıyı çalınız.",
      paymentMethod: "bank_transfer",
      invoiceInfo: {
        fullName: "Rana Karagöl",
        companyName: "Paşalı Patiserrie",
        taxNumber: "1234567890",
        taxOffice: "Kadıköy",
        billingAddress: "İstanbul",
        phone: "05321234567",
        email: "rana@example.com"
      }
    });
    const invalidPayload = await runValidators(createOrderValidator, {
      deliveryAddress: {
        province: "istanbul",
        district: "besiktas",
        neighborhood: "Levent Mahallesi",
        streetAddress: "Levent Mahallesi"
      },
      notes: "Kapıyı çalınız.",
      paymentMethod: "card",
      invoiceInfo: {
        fullName: "Rana Karagöl",
        companyName: "Paşalı Patiserrie",
        taxNumber: "1234567890",
        taxOffice: "Kadıköy",
        billingAddress: "İstanbul",
        phone: "05321234567",
        email: "rana@example.com"
      }
    });

    expect(validPayload.errors.isEmpty()).toBe(true);
    expect(missingDistrictPayload.errors.isEmpty()).toBe(false);
    expect(invalidDistrictPairPayload.errors.isEmpty()).toBe(false);
    expect(invalidPayload.errors.isEmpty()).toBe(false);
  });
});
