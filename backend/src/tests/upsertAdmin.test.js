import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAdminProfile, upsertAdmin, validateAdminProfile } from "../data/upsertAdmin.js";

const createAdminSeedEnv = (overrides = {}) => ({
  ADMIN_SEED_FIRST_NAME: "Example",
  ADMIN_SEED_LAST_NAME: "Admin",
  ADMIN_SEED_EMAIL: "admin@example.com",
  ADMIN_SEED_PASSWORD: "ChangeMe123!",
  ADMIN_SEED_PHONE: "+90 555 000 00 00",
  ADMIN_SEED_ADDRESS: "Example Address",
  ADMIN_SEED_TAX_NUMBER: "0000000000",
  ADMIN_SEED_TAX_OFFICE: "Example Tax Office",
  ...overrides
});

const createFindOneQuery = (user) => ({
  populate: vi.fn().mockResolvedValue(user)
});

describe("upsertAdmin", () => {
  let connect;
  let userModel;
  let invoiceInfoModel;
  let logger;

  beforeEach(() => {
    connect = vi.fn().mockResolvedValue(undefined);
    logger = {
      log: vi.fn(),
      error: vi.fn()
    };
    userModel = {
      findOne: vi.fn(),
      create: vi.fn()
    };
    invoiceInfoModel = {
      create: vi.fn(),
      findById: vi.fn()
    };
  });

  it("creates a fresh admin and the required invoice info snapshot", async () => {
    const env = createAdminSeedEnv();
    const user = {
      _id: "user-1",
      invoiceInfo: null,
      save: vi.fn().mockResolvedValue(undefined),
      deleteOne: vi.fn().mockResolvedValue(undefined)
    };
    const invoiceInfo = {
      _id: "invoice-1"
    };

    userModel.findOne.mockReturnValue(createFindOneQuery(null));
    userModel.create.mockResolvedValue(user);
    invoiceInfoModel.create.mockResolvedValue(invoiceInfo);

    const result = await upsertAdmin({
      env,
      connect,
      userModel,
      invoiceInfoModel,
      logger
    });

    expect(connect).toHaveBeenCalled();
    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "admin@example.com",
        role: "admin"
      })
    );
    expect(invoiceInfoModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user: "user-1",
        fullName: "Example Admin",
        companyName: "Paşalı Patisserie",
        taxNumber: "0000000000",
        taxOffice: "Example Tax Office"
      })
    );
    expect(user.invoiceInfo).toBe("invoice-1");
    expect(user.save).toHaveBeenCalled();
    expect(result.createdNewUser).toBe(true);
    expect(result.createdNewInvoiceInfo).toBe(true);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.log.mock.calls.flat().join(" ")).not.toContain(env.ADMIN_SEED_PASSWORD);
  });

  it("stays idempotent and updates an existing admin without creating duplicates", async () => {
    const env = createAdminSeedEnv({
      ADMIN_SEED_PHONE: "+90 555 111 11 11",
      ADMIN_SEED_ADDRESS: "Updated Example Address"
    });
    const existingUser = {
      _id: "user-1",
      firstName: "Old",
      lastName: "Admin",
      phone: "old-phone",
      address: "old-address",
      role: "customer",
      password: "old-password",
      invoiceInfo: "invoice-1",
      save: vi.fn().mockResolvedValue(undefined)
    };
    const existingInvoiceInfo = {
      _id: "invoice-1",
      companyName: "",
      save: vi.fn().mockResolvedValue(undefined)
    };

    userModel.findOne.mockReturnValue(createFindOneQuery(existingUser));
    invoiceInfoModel.findById.mockResolvedValue(existingInvoiceInfo);

    const result = await upsertAdmin({
      env,
      connect,
      userModel,
      invoiceInfoModel,
      logger
    });

    expect(userModel.create).not.toHaveBeenCalled();
    expect(invoiceInfoModel.create).not.toHaveBeenCalled();
    expect(existingUser.role).toBe("admin");
    expect(existingUser.phone).toBe("+90 555 111 11 11");
    expect(existingUser.address).toBe("Updated Example Address");
    expect(existingUser.save).toHaveBeenCalledTimes(1);
    expect(existingInvoiceInfo.taxNumber).toBe("0000000000");
    expect(existingInvoiceInfo.taxOffice).toBe("Example Tax Office");
    expect(existingInvoiceInfo.companyName).toBe("Paşalı Patisserie");
    expect(existingInvoiceInfo.save).toHaveBeenCalledTimes(1);
    expect(result.createdNewUser).toBe(false);
    expect(result.createdNewInvoiceInfo).toBe(false);
  });

  it("throws a clear error when required invoice seed values are missing", async () => {
    const env = createAdminSeedEnv({
      ADMIN_SEED_TAX_NUMBER: "",
      ADMIN_SEED_TAX_OFFICE: ""
    });

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow(/ADMIN_SEED_TAX_NUMBER, ADMIN_SEED_TAX_OFFICE/);

    expect(connect).not.toHaveBeenCalled();
  });

  it("cleans up a newly created admin if invoice info creation fails", async () => {
    const env = createAdminSeedEnv();
    const user = {
      _id: "user-1",
      invoiceInfo: null,
      save: vi.fn().mockResolvedValue(undefined),
      deleteOne: vi.fn().mockResolvedValue(undefined)
    };
    const invoiceError = new Error("Invoice create failed.");

    userModel.findOne.mockReturnValue(createFindOneQuery(null));
    userModel.create.mockResolvedValue(user);
    invoiceInfoModel.create.mockRejectedValue(invoiceError);

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow("Invoice create failed.");

    expect(user.deleteOne).toHaveBeenCalledTimes(1);
    expect(logger.log).not.toHaveBeenCalled();
  });

  it("builds a safe default admin profile when optional values are omitted", () => {
    const profile = buildAdminProfile(createAdminSeedEnv({
      ADMIN_SEED_FIRST_NAME: "",
      ADMIN_SEED_LAST_NAME: "",
      ADMIN_SEED_EMAIL: "",
      ADMIN_SEED_PASSWORD: "",
      ADMIN_SEED_PHONE: "",
      ADMIN_SEED_ADDRESS: ""
    }));

    expect(profile.firstName).toBe("Example");
    expect(profile.lastName).toBe("Admin");
    expect(profile.email).toBe("admin@example.com");
    expect(profile.phone).toBe("+90 555 000 00 00");
    expect(profile.address).toBe("Example Address");
  });

  it("validates the required invoice fields independently", () => {
    expect(() =>
      validateAdminProfile({
        ...buildAdminProfile(createAdminSeedEnv()),
        taxNumber: "",
        taxOffice: ""
      })
    ).toThrow(/ADMIN_SEED_TAX_NUMBER, ADMIN_SEED_TAX_OFFICE/);
  });
});
