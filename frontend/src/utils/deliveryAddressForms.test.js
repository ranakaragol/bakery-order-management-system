import test from "node:test";
import assert from "node:assert/strict";
import { buildCheckoutForm, buildProfileForm, createEmptyCheckoutForm } from "./deliveryAddressForms.js";

const sampleUser = {
  firstName: "Osman",
  lastName: "Karagöl",
  email: "osman@example.com",
  phone: "05321234567",
  address: "Ev, Kozyatağı Mahallesi, Gül Sokak No:12, 34742 Kadıköy / İstanbul",
  deliveryAddress: {
    addressTitle: "Ev",
    province: "istanbul",
    district: "kadikoy",
    neighborhood: "Kozyatağı Mahallesi",
    streetAddress: "Gül Sokak No:12",
    postalCode: "34742"
  },
  billingAddress: {
    fullName: "Osman Karagöl",
    companyName: "Paşalı Patiserrie",
    taxOffice: "Kadıköy",
    taxNumber: "1234567890",
    email: "osman@example.com",
    phone: "05321234567",
    billingAddress: "Kozyatağı Mahallesi, Kadıköy / İstanbul"
  },
  invoiceInfo: {
    identityNumber: ""
  }
};

test("buildProfileForm keeps the persisted delivery address values visible in the profile form", () => {
  const form = buildProfileForm(sampleUser);

  assert.equal(form.deliveryAddress.addressTitle, "Ev");
  assert.equal(form.deliveryAddress.province, "istanbul");
  assert.equal(form.deliveryAddress.district, "kadikoy");
  assert.equal(form.deliveryAddress.neighborhood, "Kozyatağı Mahallesi");
  assert.equal(form.deliveryAddress.streetAddress, "Gül Sokak No:12");
  assert.equal(form.deliveryAddress.postalCode, "34742");
});

test("buildCheckoutForm prefills checkout with the saved profile address", () => {
  const form = buildCheckoutForm(sampleUser, createEmptyCheckoutForm());

  assert.equal(form.deliveryAddress.addressTitle, "Ev");
  assert.equal(form.deliveryAddress.province, "istanbul");
  assert.equal(form.deliveryAddress.district, "kadikoy");
  assert.equal(form.deliveryAddress.neighborhood, "Kozyatağı Mahallesi");
  assert.equal(form.deliveryAddress.streetAddress, "Gül Sokak No:12");
  assert.equal(form.deliveryAddress.postalCode, "34742");
  assert.equal(form.invoiceInfo.fullName, "Osman Karagöl");
});

test("buildCheckoutForm preserves a checkout-only address override when requested", () => {
  const checkoutDraft = {
    ...createEmptyCheckoutForm(),
    notes: "Kapıyı çalınız",
    deliveryAddress: {
      addressTitle: "Depo",
      province: "kocaeli",
      district: "izmit",
      neighborhood: "Yahya Kaptan Mahallesi",
      streetAddress: "Deneme Sokak No:8",
      postalCode: "41050"
    }
  };
  const form = buildCheckoutForm(sampleUser, checkoutDraft, {
    preserveDeliveryAddress: true
  });

  assert.equal(form.deliveryAddress.addressTitle, "Depo");
  assert.equal(form.deliveryAddress.province, "kocaeli");
  assert.equal(form.deliveryAddress.district, "izmit");
  assert.equal(form.deliveryAddress.neighborhood, "Yahya Kaptan Mahallesi");
  assert.equal(form.deliveryAddress.streetAddress, "Deneme Sokak No:8");
  assert.equal(form.deliveryAddress.postalCode, "41050");
  assert.equal(form.notes, "Kapıyı çalınız");
});
