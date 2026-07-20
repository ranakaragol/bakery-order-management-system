import { describe, expect, it } from "vitest";
import { sanitizeUser } from "../utils/sanitizeUser.js";

describe("sanitizeUser", () => {
  it("keeps the complete structured delivery address in auth responses", () => {
    const user = {
      _id: "user-1",
      firstName: "Osman",
      lastName: "Karagöl",
      email: "osman@example.com",
      phone: "05321234567",
      address: "Ev, Caferağa Mahallesi, Moda Caddesi No:10, 34710 Kadıköy / İstanbul",
      deliveryAddress: {
        addressTitle: "Ev",
        province: "istanbul",
        district: "kadikoy",
        neighborhood: "Caferağa Mahallesi",
        streetAddress: "Moda Caddesi No:10",
        postalCode: "34710"
      },
      billingAddress: {},
      role: "customer",
      invoiceInfo: null,
      createdAt: "2026-07-16T12:00:00.000Z",
      updatedAt: "2026-07-16T12:00:00.000Z"
    };

    expect(sanitizeUser(user)).toEqual(
      expect.objectContaining({
        address: "Ev, Caferağa Mahallesi, Moda Caddesi No:10, 34710 Kadıköy / İstanbul",
        deliveryAddress: {
          addressTitle: "Ev",
          province: "istanbul",
          district: "kadikoy",
          neighborhood: "Caferağa Mahallesi",
          streetAddress: "Moda Caddesi No:10",
          postalCode: "34710"
        }
      })
    );
  });
});
