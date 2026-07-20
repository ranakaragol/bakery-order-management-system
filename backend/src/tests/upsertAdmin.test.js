import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAdminProfile,
  shouldApplyAdminPassword,
  upsertAdmin,
  validateAdminProfile
} from "../data/upsertAdmin.js";

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

const withoutSeedPassword = (env) => {
  const nextEnv = { ...env };

  delete nextEnv.ADMIN_SEED_PASSWORD;

  return nextEnv;
};

const createFindOneQuery = (user) => {
  const query = {
    select: vi.fn(() => query),
    populate: vi.fn().mockResolvedValue(user)
  };

  return query;
};

const createExistingUser = (overrides = {}) => ({
  _id: "user-1",
  firstName: "Old",
  lastName: "Admin",
  email: "admin@example.com",
  phone: "old-phone",
  address: "old-address",
  role: "customer",
  password: "hashed-old-password",
  invoiceInfo: "invoice-1",
  save: vi.fn().mockResolvedValue(undefined),
  updateOne: vi.fn().mockResolvedValue(undefined),
  ...overrides
});

const createInvoiceInfo = (overrides = {}) => ({
  _id: "invoice-1",
  companyName: "",
  save: vi.fn().mockResolvedValue(undefined),
  validate: vi.fn().mockResolvedValue(undefined),
  ...overrides
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
      create: vi.fn(),
      updateOne: vi.fn().mockResolvedValue(undefined)
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
        role: "admin",
        password: "ChangeMe123!"
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
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(result.createdNewUser).toBe(true);
    expect(result.createdNewInvoiceInfo).toBe(true);
    expect(logger.log).toHaveBeenCalledTimes(1);
    expect(logger.log.mock.calls.flat().join(" ")).not.toContain(env.ADMIN_SEED_PASSWORD);
  });

  it("stays idempotent and updates an existing admin without creating duplicates", async () => {
    const env = withoutSeedPassword(
      createAdminSeedEnv({
        ADMIN_SEED_PHONE: "+90 555 111 11 11",
        ADMIN_SEED_ADDRESS: "Updated Example Address"
      })
    );
    const existingUser = createExistingUser();
    const existingInvoiceInfo = createInvoiceInfo();

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
    expect(existingUser.password).toBe("hashed-old-password");
    expect(existingUser.save).toHaveBeenCalledTimes(1);
    expect(existingInvoiceInfo.taxNumber).toBe("0000000000");
    expect(existingInvoiceInfo.taxOffice).toBe("Example Tax Office");
    expect(existingInvoiceInfo.companyName).toBe("Paşalı Patisserie");
    expect(existingInvoiceInfo.validate).toHaveBeenCalledTimes(1);
    expect(existingInvoiceInfo.save).toHaveBeenCalledTimes(1);
    expect(result.createdNewUser).toBe(false);
    expect(result.createdNewInvoiceInfo).toBe(false);
  });

  it("updates the existing admin password only when the seed password is explicitly set", async () => {
    const env = createAdminSeedEnv({
      ADMIN_SEED_PASSWORD: "NewSeedPassword123!"
    });
    const existingUser = createExistingUser();
    const existingInvoiceInfo = createInvoiceInfo();

    userModel.findOne.mockReturnValue(createFindOneQuery(existingUser));
    invoiceInfoModel.findById.mockResolvedValue(existingInvoiceInfo);

    await upsertAdmin({
      env,
      connect,
      userModel,
      invoiceInfoModel,
      logger
    });

    expect(existingUser.password).toBe("NewSeedPassword123!");
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

  it("catches invoice validation failures before any existing user write occurs", async () => {
    const env = withoutSeedPassword(createAdminSeedEnv());
    const existingUser = createExistingUser();
    const validationError = new Error("Invoice validation failed.");
    const existingInvoiceInfo = createInvoiceInfo({
      validate: vi.fn().mockRejectedValue(validationError)
    });

    userModel.findOne.mockReturnValue(createFindOneQuery(existingUser));
    invoiceInfoModel.findById.mockResolvedValue(existingInvoiceInfo);

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow("Invoice validation failed.");

    expect(existingUser.save).not.toHaveBeenCalled();
    expect(userModel.updateOne).not.toHaveBeenCalled();
  });

  it("rolls back an existing admin when invoice persistence fails after the user update", async () => {
    const env = createAdminSeedEnv({
      ADMIN_SEED_PHONE: "+90 555 222 22 22",
      ADMIN_SEED_ADDRESS: "Rollback Test Address",
      ADMIN_SEED_PASSWORD: "NewSeedPassword123!"
    });
    const existingUser = createExistingUser();
    const invoiceError = new Error("Invoice save failed.");
    const existingInvoiceInfo = createInvoiceInfo({
      save: vi.fn().mockRejectedValue(invoiceError)
    });

    userModel.findOne.mockReturnValue(createFindOneQuery(existingUser));
    invoiceInfoModel.findById.mockResolvedValue(existingInvoiceInfo);

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow("Invoice save failed.");

    expect(existingUser.save).toHaveBeenCalledTimes(1);
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: "user-1" },
      expect.objectContaining({
        firstName: "Old",
        lastName: "Admin",
        phone: "old-phone",
        address: "old-address",
        role: "customer",
        password: "hashed-old-password"
      })
    );
    expect(existingUser.password).toBe("hashed-old-password");
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("preserves the original invoice error when rollback also fails", async () => {
    const env = createAdminSeedEnv({
      ADMIN_SEED_PASSWORD: "NewSeedPassword123!"
    });
    const existingUser = createExistingUser();
    const invoiceError = new Error("Invoice save failed.");
    const existingInvoiceInfo = createInvoiceInfo({
      save: vi.fn().mockRejectedValue(invoiceError)
    });

    userModel.findOne.mockReturnValue(createFindOneQuery(existingUser));
    userModel.updateOne.mockRejectedValue(new Error("Rollback failed."));
    invoiceInfoModel.findById.mockResolvedValue(existingInvoiceInfo);

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow("Invoice save failed.");

    expect(existingUser.save).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith("Admin rollback failed after invoice persistence error.");
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

  it("removes a newly created invoice snapshot if linking it back to the user fails", async () => {
    const env = createAdminSeedEnv();
    const user = {
      _id: "user-1",
      invoiceInfo: null,
      save: vi
        .fn()
        .mockRejectedValueOnce(new Error("User save failed while linking invoice info.")),
      deleteOne: vi.fn().mockResolvedValue(undefined)
    };
    const invoiceInfo = {
      _id: "invoice-1",
      deleteOne: vi.fn().mockResolvedValue(undefined)
    };

    userModel.findOne.mockReturnValue(createFindOneQuery(null));
    userModel.create.mockResolvedValue(user);
    invoiceInfoModel.create.mockResolvedValue(invoiceInfo);

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow("User save failed while linking invoice info.");

    expect(invoiceInfo.deleteOne).toHaveBeenCalledTimes(1);
    expect(user.deleteOne).toHaveBeenCalledTimes(1);
  });

  it("removes a newly created invoice snapshot before rolling an existing user back", async () => {
    const env = withoutSeedPassword(
      createAdminSeedEnv({
        ADMIN_SEED_PHONE: "+90 555 444 44 44"
      })
    );
    const existingUser = createExistingUser({
      invoiceInfo: null,
      save: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("User save failed while linking invoice info."))
    });
    const invoiceInfo = {
      _id: "invoice-1",
      deleteOne: vi.fn().mockResolvedValue(undefined)
    };

    userModel.findOne.mockReturnValue(createFindOneQuery(existingUser));
    invoiceInfoModel.create.mockResolvedValue(invoiceInfo);

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow("User save failed while linking invoice info.");

    expect(invoiceInfo.deleteOne).toHaveBeenCalledTimes(1);
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: "user-1" },
      expect.objectContaining({
        phone: "old-phone",
        address: "old-address"
      })
    );
  });

  it("does not rehash or overwrite the existing password during rollback when the seed password is omitted", async () => {
    const env = withoutSeedPassword(
      createAdminSeedEnv({
        ADMIN_SEED_PHONE: "+90 555 333 33 33"
      })
    );
    const existingUser = createExistingUser();
    const invoiceError = new Error("Invoice save failed.");
    const existingInvoiceInfo = createInvoiceInfo({
      save: vi.fn().mockRejectedValue(invoiceError)
    });

    userModel.findOne.mockReturnValue(createFindOneQuery(existingUser));
    invoiceInfoModel.findById.mockResolvedValue(existingInvoiceInfo);

    await expect(
      upsertAdmin({
        env,
        connect,
        userModel,
        invoiceInfoModel,
        logger
      })
    ).rejects.toThrow("Invoice save failed.");

    expect(existingUser.save).toHaveBeenCalledTimes(1);
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: "user-1" },
      expect.not.objectContaining({
        password: expect.anything()
      })
    );
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

  it("detects whether the seed password was explicitly provided", () => {
    expect(shouldApplyAdminPassword(createAdminSeedEnv())).toBe(true);
    expect(shouldApplyAdminPassword(withoutSeedPassword(createAdminSeedEnv()))).toBe(false);
    expect(shouldApplyAdminPassword(createAdminSeedEnv({ ADMIN_SEED_PASSWORD: "   " }))).toBe(false);
  });
});
