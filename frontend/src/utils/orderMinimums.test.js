import test from "node:test";
import assert from "node:assert/strict";
import { hasCompleteDeliveryAddress, normalizeDeliveryAddress } from "../../../shared/profile.js";
import { getDistrictOptions } from "../../../shared/deliveryZones.js";
import { getRegionalOrderNotice } from "./orderMinimums.js";

test("matches legacy delivery text into supported province and district values", () => {
  const deliveryAddress = normalizeDeliveryAddress({}, "Fulya Mah. 34365 Şişli / İstanbul");

  assert.equal(deliveryAddress.province, "istanbul");
  assert.equal(deliveryAddress.district, "sisli");
  assert.equal(deliveryAddress.neighborhood, "Fulya Mah");
  assert.equal(deliveryAddress.postalCode, "34365");
  assert.equal(deliveryAddress.streetAddress, "Fulya Mah. 34365 Şişli / İstanbul");
});

test("clears incomplete delivery addresses from validation helpers", () => {
  assert.equal(
    hasCompleteDeliveryAddress({
      province: "",
      district: "kadikoy",
      neighborhood: "Caferağa Mahallesi",
      streetAddress: "Moda Caddesi"
    }),
    false
  );
});

test("treats invalid province and district combinations as incomplete", () => {
  const deliveryAddress = normalizeDeliveryAddress({
    province: "istanbul",
    district: "izmit",
    neighborhood: "Geçersiz Mahalle",
    streetAddress: "Geçersiz eşleşme"
  });

  assert.equal(deliveryAddress.province, "istanbul");
  assert.equal(deliveryAddress.district, "");
  assert.equal(hasCompleteDeliveryAddress(deliveryAddress), false);
});

test("lists only districts that belong to the selected province", () => {
  const istanbulDistricts = getDistrictOptions("istanbul");
  const kocaeliDistricts = getDistrictOptions("kocaeli");

  assert.equal(istanbulDistricts.some((district) => district.value === "kadikoy"), true);
  assert.equal(istanbulDistricts.some((district) => district.value === "izmit"), false);
  assert.equal(kocaeliDistricts.some((district) => district.value === "izmit"), true);
});

test("accepts Istanbul Kadıköy 1.500 TL and keeps delivery free", () => {
  const notice = getRegionalOrderNotice(
    {
      province: "istanbul",
      district: "kadikoy",
      neighborhood: "Caferağa Mahallesi",
      streetAddress: "Moda Caddesi"
    },
    1500
  );

  assert.equal(notice.isBlocked, false);
  assert.equal(notice.deliveryFee, 0);
  assert.equal(notice.regionKey, "istanbul_anatolian");
});

test("does not apply the special minimum to Istanbul Üsküdar 1.999,99 TL", () => {
  const notice = getRegionalOrderNotice(
    {
      province: "istanbul",
      district: "uskudar",
      neighborhood: "Altunizade Mahallesi",
      streetAddress: "Altunizade Caddesi"
    },
    1999.99
  );

  assert.equal(notice.isBlocked, false);
  assert.equal(notice.deliveryFee, 0);
});

test("rejects Istanbul Beşiktaş 1.999,99 TL and reports the shortfall", () => {
  const notice = getRegionalOrderNotice(
    {
      province: "istanbul",
      district: "besiktas",
      neighborhood: "Levent Mahallesi",
      streetAddress: "Levent Caddesi"
    },
    1999.99
  );

  assert.equal(notice.isBlocked, true);
  assert.equal(notice.remainingAmount, 0.01);
  assert.match(notice.warningMessage, /minimum sipariş tutarı 2.000 TL/);
});

test("accepts Istanbul Beşiktaş 2.000 TL and above", () => {
  const exactNotice = getRegionalOrderNotice(
    {
      province: "istanbul",
      district: "besiktas",
      neighborhood: "Levent Mahallesi",
      streetAddress: "Levent Caddesi"
    },
    2000
  );
  const aboveNotice = getRegionalOrderNotice(
    {
      province: "istanbul",
      district: "besiktas",
      neighborhood: "Levent Mahallesi",
      streetAddress: "Levent Caddesi"
    },
    2150
  );

  assert.equal(exactNotice.isBlocked, false);
  assert.equal(aboveNotice.isBlocked, false);
});

test("rejects Kocaeli İzmit 1.999,99 TL and accepts 2.000 TL", () => {
  const belowNotice = getRegionalOrderNotice(
    {
      province: "kocaeli",
      district: "izmit",
      neighborhood: "Yahya Kaptan Mahallesi",
      streetAddress: "Yahya Kaptan"
    },
    1999.99
  );
  const exactNotice = getRegionalOrderNotice(
    {
      province: "kocaeli",
      district: "izmit",
      neighborhood: "Yahya Kaptan Mahallesi",
      streetAddress: "Yahya Kaptan"
    },
    2000
  );

  assert.equal(belowNotice.isBlocked, true);
  assert.equal(exactNotice.isBlocked, false);
});
