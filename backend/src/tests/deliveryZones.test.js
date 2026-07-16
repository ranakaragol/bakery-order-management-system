import { describe, expect, it } from "vitest";
import {
  DELIVERY_REGION_KEYS,
  getDistrictOptions,
  getMinimumOrderRuleStatus,
  getProvinceOptions,
  isValidProvinceDistrictPair,
  parseLegacyDeliveryAddressText
} from "../../../shared/deliveryZones.js";

describe("delivery zone helpers", () => {
  it("exposes supported provinces and province-scoped district lists", () => {
    expect(getProvinceOptions().map((province) => province.value)).toEqual(["istanbul", "kocaeli"]);
    expect(getDistrictOptions("istanbul").some((district) => district.value === "kadikoy")).toBe(true);
    expect(getDistrictOptions("istanbul").some((district) => district.value === "izmit")).toBe(false);
    expect(getDistrictOptions("kocaeli").some((district) => district.value === "izmit")).toBe(true);
  });

  it("matches legacy address text to supported province and district values", () => {
    expect(parseLegacyDeliveryAddressText("Fulya Mah. Şişli / İstanbul")).toEqual({
      province: "istanbul",
      district: "sisli"
    });
  });

  it("validates province and district pairs", () => {
    expect(isValidProvinceDistrictPair("istanbul", "kadikoy")).toBe(true);
    expect(isValidProvinceDistrictPair("istanbul", "izmit")).toBe(false);
  });

  it("keeps Istanbul Kadıköy and Üsküdar orders free and outside the special minimum", () => {
    const kadikoyStatus = getMinimumOrderRuleStatus({
      province: "istanbul",
      district: "kadikoy",
      subtotal: 1500,
      fallbackDeliveryFee: 120
    });
    const uskudarStatus = getMinimumOrderRuleStatus({
      province: "istanbul",
      district: "uskudar",
      subtotal: 1999.99,
      fallbackDeliveryFee: 120
    });

    expect(kadikoyStatus.regionKey).toBe(DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN);
    expect(kadikoyStatus.deliveryFee).toBe(0);
    expect(kadikoyStatus.isBlocked).toBe(false);
    expect(uskudarStatus.deliveryFee).toBe(0);
    expect(uskudarStatus.isBlocked).toBe(false);
  });

  it("enforces the 2.000 TL minimum for Istanbul Avrupa Yakası and Kocaeli", () => {
    const besiktasBelow = getMinimumOrderRuleStatus({
      province: "istanbul",
      district: "besiktas",
      subtotal: 1999.99
    });
    const besiktasExact = getMinimumOrderRuleStatus({
      province: "istanbul",
      district: "besiktas",
      subtotal: 2000
    });
    const besiktasAbove = getMinimumOrderRuleStatus({
      province: "istanbul",
      district: "besiktas",
      subtotal: 2150
    });
    const izmitBelow = getMinimumOrderRuleStatus({
      province: "kocaeli",
      district: "izmit",
      subtotal: 1999.99
    });
    const izmitExact = getMinimumOrderRuleStatus({
      province: "kocaeli",
      district: "izmit",
      subtotal: 2000
    });

    expect(besiktasBelow.regionKey).toBe(DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN);
    expect(besiktasBelow.isBlocked).toBe(true);
    expect(besiktasBelow.remainingAmount).toBe(0.01);
    expect(besiktasExact.isBlocked).toBe(false);
    expect(besiktasAbove.isBlocked).toBe(false);
    expect(izmitBelow.regionKey).toBe(DELIVERY_REGION_KEYS.KOCAELI);
    expect(izmitBelow.isBlocked).toBe(true);
    expect(izmitExact.isBlocked).toBe(false);
  });
});
