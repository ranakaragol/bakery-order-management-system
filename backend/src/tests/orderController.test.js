import { beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeBillingAddress } from "../../../shared/profile.js";

const mocks = vi.hoisted(() => ({
  cartFindOne: vi.fn(),
  invoiceFindById: vi.fn(),
  invoiceCreate: vi.fn(),
  orderCreate: vi.fn(),
  orderFindById: vi.fn(),
  userFindByIdAndUpdate: vi.fn()
}));

vi.mock("../models/Cart.js", () => ({
  default: {
    findOne: mocks.cartFindOne
  }
}));

vi.mock("../models/InvoiceInfo.js", () => ({
  default: {
    findById: mocks.invoiceFindById,
    create: mocks.invoiceCreate
  }
}));

vi.mock("../models/Order.js", () => ({
  default: {
    create: mocks.orderCreate,
    findById: mocks.orderFindById
  }
}));

vi.mock("../models/User.js", () => ({
  default: {
    findByIdAndUpdate: mocks.userFindByIdAndUpdate
  }
}));

const { createOrder } = await import("../controllers/orderController.js");

const createResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn()
  };

  response.status.mockReturnValue(response);

  return response;
};

const createCustomer = (overrides = {}) => ({
  _id: "user-1",
  address: "Levent Mahallesi, Beşiktaş / İstanbul",
  email: "rana@example.com",
  phone: "05321234567",
  invoiceInfo: "invoice-1",
  billingAddress: normalizeBillingAddress({
    fullName: "Rana Karagöl",
    companyName: "Paşalı Patiserrie",
    taxOffice: "Kadıköy",
    taxNumber: "1234567890",
    email: "rana@example.com",
    phone: "05321234567",
    billingAddress: "Teslimat adresi"
  }),
  save: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

const createCart = (unitPrice) => ({
  items: [
    {
      product: {
        _id: "product-1",
        name: "Profiterol",
        price: unitPrice,
        unit: "adet"
      },
      quantity: 1,
      unitSnapshot: "adet",
      nameSnapshot: "Profiterol",
      imageUrlSnapshot: "/assets/products/profiterol.jpg",
      variantId: "",
      variantName: ""
    }
  ],
  itemCount: 1,
  subtotal: unitPrice,
  save: vi.fn().mockResolvedValue(undefined)
});

const createInvoiceInfo = () => ({
  _id: "invoice-1",
  fullName: "Rana Karagöl",
  companyName: "Paşalı Patiserrie",
  taxOffice: "Kadıköy",
  taxNumber: "1234567890",
  billingAddress: "Fulya Mah. Şişli / İstanbul",
  phone: "05321234567",
  email: "rana@example.com"
});

const mockSuccessfulOrderRead = (orderId = "order-1") => {
  mocks.orderFindById.mockReturnValue({
    populate: vi.fn().mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: orderId,
        status: "Hazirlaniyor"
      })
    })
  });
};

const buildOrderBody = (
  province,
  district,
  neighborhood,
  streetAddress,
  paymentMethod = "cash_on_delivery"
) => ({
  deliveryAddress: {
    addressTitle: "Merkez",
    province,
    district,
    neighborhood,
    streetAddress,
    postalCode: "34710"
  },
  notes: "",
  paymentMethod,
  invoiceInfo: {}
});

const executeOrder = async ({ unitPrice, province, district, neighborhood, streetAddress, paymentMethod }) => {
  const response = createResponse();

  mocks.cartFindOne.mockReturnValue({
    populate: vi.fn().mockResolvedValue(createCart(unitPrice))
  });

  if (
    unitPrice >= 2000 ||
    (province === "istanbul" && (district === "kadikoy" || district === "uskudar"))
  ) {
    mocks.invoiceFindById.mockResolvedValue(createInvoiceInfo());
    mocks.orderCreate.mockResolvedValue({ _id: "order-1" });
    mockSuccessfulOrderRead();
  }

  await createOrder(
    {
      body: buildOrderBody(province, district, neighborhood, streetAddress, paymentMethod),
      user: createCustomer()
    },
    response,
    vi.fn()
  );

  return response;
};

const executeOrderWithCustomerOverrides = async ({
  unitPrice,
  province,
  district,
  neighborhood,
  streetAddress,
  paymentMethod,
  customerOverrides
}) => {
  const response = createResponse();

  mocks.cartFindOne.mockReturnValue({
    populate: vi.fn().mockResolvedValue(createCart(unitPrice))
  });
  mocks.invoiceFindById.mockResolvedValue(createInvoiceInfo());
  mocks.orderCreate.mockResolvedValue({ _id: "order-1" });
  mockSuccessfulOrderRead();

  await createOrder(
    {
      body: buildOrderBody(province, district, neighborhood, streetAddress, paymentMethod),
      user: createCustomer(customerOverrides)
    },
    response,
    vi.fn()
  );

  return response;
};

describe("createOrder regional delivery rules", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mockFn) => mockFn.mockReset());
  });

  it("accepts Istanbul Kadikoy 1500 TL and keeps delivery free", async () => {
    const response = await executeOrder({
      unitPrice: 1500,
      province: "istanbul",
      district: "kadikoy",
      neighborhood: "Caferağa Mahallesi",
      streetAddress: "Moda Caddesi"
    });

    expect(response.status).toHaveBeenCalledWith(201);
    expect(mocks.orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 1500,
        deliveryFee: 0,
        totalAmount: 1500,
        addressSnapshot: "Merkez, Caferağa Mahallesi, Moda Caddesi, 34710 Kadıköy / İstanbul",
        deliveryAddressSnapshot: expect.objectContaining({
          addressTitle: "Merkez",
          province: "istanbul",
          district: "kadikoy",
          neighborhood: "Caferağa Mahallesi",
          postalCode: "34710",
          region: "istanbul_anatolian"
        })
      })
    );
  });

  it("accepts checkout invoice info even when the user billing address is not stored yet", async () => {
    const response = await executeOrderWithCustomerOverrides({
      unitPrice: 1500,
      province: "istanbul",
      district: "kadikoy",
      neighborhood: "Caferağa Mahallesi",
      streetAddress: "Moda Caddesi",
      customerOverrides: {
        billingAddress: {
          fullName: "",
          companyName: "",
          taxOffice: "",
          taxNumber: "",
          email: "",
          phone: "",
          billingAddress: ""
        }
      }
    });

    expect(response.status).toHaveBeenCalledWith(201);
    expect(mocks.orderCreate).toHaveBeenCalled();
  });

  it("accepts Istanbul Uskudar 1999.99 TL", async () => {
    const response = await executeOrder({
      unitPrice: 1999.99,
      province: "istanbul",
      district: "uskudar",
      neighborhood: "Altunizade Mahallesi",
      streetAddress: "Altunizade"
    });

    expect(response.status).toHaveBeenCalledWith(201);
  });

  it("rejects Istanbul Besiktas 1999.99 TL", async () => {
    const response = await executeOrder({
      unitPrice: 1999.99,
      province: "istanbul",
      district: "besiktas",
      neighborhood: "Levent Mahallesi",
      streetAddress: "Levent"
    });

    expect(response.status).toHaveBeenCalledWith(422);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "DELIVERY_REGION_MINIMUM_ORDER",
        remainingAmount: 0.01,
        region: "istanbul_european"
      })
    );
    expect(mocks.orderCreate).not.toHaveBeenCalled();
  });

  it("accepts Istanbul Besiktas at and above 2000 TL", async () => {
    const exactResponse = await executeOrder({
      unitPrice: 2000,
      province: "istanbul",
      district: "besiktas",
      neighborhood: "Levent Mahallesi",
      streetAddress: "Levent"
    });
    const aboveResponse = await executeOrder({
      unitPrice: 2125,
      province: "istanbul",
      district: "besiktas",
      neighborhood: "Levent Mahallesi",
      streetAddress: "Levent"
    });

    expect(exactResponse.status).toHaveBeenCalledWith(201);
    expect(aboveResponse.status).toHaveBeenCalledWith(201);
  });

  it("rejects Kocaeli Izmit 1999.99 TL and accepts 2000 TL", async () => {
    const belowResponse = await executeOrder({
      unitPrice: 1999.99,
      province: "kocaeli",
      district: "izmit",
      neighborhood: "Yahya Kaptan Mahallesi",
      streetAddress: "Yahya Kaptan"
    });
    const exactResponse = await executeOrder({
      unitPrice: 2000,
      province: "kocaeli",
      district: "izmit",
      neighborhood: "Yahya Kaptan Mahallesi",
      streetAddress: "Yahya Kaptan"
    });

    expect(belowResponse.status).toHaveBeenCalledWith(422);
    expect(exactResponse.status).toHaveBeenCalledWith(201);
  });

  it("rejects invalid province and district combinations", async () => {
    const response = await executeOrder({
      unitPrice: 2100,
      province: "istanbul",
      district: "izmit",
      neighborhood: "Gecersiz Mahalle",
      streetAddress: "Gecersiz eslesme"
    });

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Teslimat ili ve ilçesi geçersiz veya birbiriyle uyumsuz."
      })
    );
  });
});
