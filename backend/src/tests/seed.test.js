import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedDatabase, runSeedCli } from "../data/seed.js";

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

describe("seedDatabase", () => {
  let connect;
  let disconnect;
  let logger;
  let categoryModel;
  let productModel;
  let contactInfoModel;
  let invoiceInfoModel;
  let userModel;
  let upsertAdminFn;

  beforeEach(() => {
    connect = vi.fn().mockResolvedValue(undefined);
    disconnect = vi.fn().mockResolvedValue(undefined);
    logger = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    categoryModel = {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      insertMany: vi.fn().mockResolvedValue([
        { _id: "category-1", name: "Pastalar" },
        { _id: "category-2", name: "Ekler" }
      ])
    };
    productModel = {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      insertMany: vi.fn().mockResolvedValue(undefined)
    };
    contactInfoModel = {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined)
    };
    invoiceInfoModel = {
      deleteMany: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(undefined)
    };
    userModel = {
      deleteMany: vi.fn().mockResolvedValue(undefined)
    };
    upsertAdminFn = vi.fn().mockResolvedValue(undefined);
  });

  it("validates the admin environment before any destructive work starts", async () => {
    const env = createAdminSeedEnv({
      ADMIN_SEED_TAX_NUMBER: "",
      ADMIN_SEED_TAX_OFFICE: ""
    });

    await expect(
      seedDatabase({
        env,
        connect,
        disconnect,
        categoryModel,
        contactInfoModel,
        invoiceInfoModel,
        productModel,
        userModel,
        upsertAdminFn,
        logger
      })
    ).rejects.toThrow(/ADMIN_SEED_TAX_NUMBER, ADMIN_SEED_TAX_OFFICE/);

    expect(connect).not.toHaveBeenCalled();
    expect(productModel.deleteMany).not.toHaveBeenCalled();
    expect(categoryModel.deleteMany).not.toHaveBeenCalled();
    expect(contactInfoModel.deleteMany).not.toHaveBeenCalled();
    expect(invoiceInfoModel.deleteMany).not.toHaveBeenCalled();
    expect(userModel.deleteMany).not.toHaveBeenCalled();
    expect(upsertAdminFn).not.toHaveBeenCalled();
  });

  it("reseeds the catalog and delegates admin creation to the shared upsert flow", async () => {
    const env = createAdminSeedEnv({
      ADMIN_SEED_EMAIL: "ops-admin@example.com",
      ADMIN_SEED_PHONE: "+90 555 222 22 22",
      ADMIN_SEED_ADDRESS: "Shared Seed Address"
    });

    await seedDatabase({
      env,
      connect,
      disconnect,
      categoryModel,
      contactInfoModel,
      invoiceInfoModel,
      productModel,
      userModel,
      upsertAdminFn,
      logger
    });

    expect(connect).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(productModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(categoryModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(contactInfoModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(invoiceInfoModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(userModel.deleteMany).toHaveBeenCalledTimes(1);
    expect(categoryModel.insertMany).toHaveBeenCalledTimes(1);
    expect(productModel.insertMany).toHaveBeenCalledTimes(1);
    expect(contactInfoModel.create).toHaveBeenCalledTimes(1);
    expect(invoiceInfoModel.create).not.toHaveBeenCalled();
    expect(upsertAdminFn).toHaveBeenCalledWith(
      expect.objectContaining({
        env,
        adminProfile: expect.objectContaining({
          email: "ops-admin@example.com",
          phone: "+90 555 222 22 22",
          address: "Shared Seed Address",
          taxNumber: "0000000000",
          taxOffice: "Example Tax Office"
        }),
        connect: expect.any(Function),
        userModel,
        invoiceInfoModel,
        logger
      })
    );
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(logger.log).toHaveBeenCalledWith("Seed completed successfully.");

    const categoryInsertPayload = categoryModel.insertMany.mock.calls[0][0];
    const productInsertPayload = productModel.insertMany.mock.calls[0][0];
    expect(categoryInsertPayload[0]).toEqual(expect.objectContaining({ slug: expect.any(String) }));
    expect(productInsertPayload.every((product) => typeof product.imageUrl === "string")).toBe(true);
    expect(productInsertPayload.some((product) => product.category === "category-1")).toBe(true);
    expect(connect.mock.invocationCallOrder[0]).toBeLessThan(logger.warn.mock.invocationCallOrder[0]);
    expect(logger.warn.mock.invocationCallOrder[0]).toBeLessThan(productModel.deleteMany.mock.invocationCallOrder[0]);
    expect(productModel.insertMany.mock.invocationCallOrder[0]).toBeLessThan(upsertAdminFn.mock.invocationCallOrder[0]);
  });

  it("disconnects safely and preserves the original seed error", async () => {
    const env = createAdminSeedEnv();
    const seedError = new Error("Shared upsert failed.");

    upsertAdminFn.mockRejectedValue(seedError);

    await expect(
      seedDatabase({
        env,
        connect,
        disconnect,
        categoryModel,
        contactInfoModel,
        invoiceInfoModel,
        productModel,
        userModel,
        upsertAdminFn,
        logger
      })
    ).rejects.toThrow("Shared upsert failed.");

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

describe("runSeedCli", () => {
  it("exits with code 0 after a successful seed run", async () => {
    const seed = vi.fn().mockResolvedValue(undefined);
    const exit = vi.fn();
    const logger = {
      error: vi.fn()
    };

    await runSeedCli({ seed, logger, exit });

    expect(exit).toHaveBeenCalledWith(0);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("exits with code 1 and logs the failure when the seed run throws", async () => {
    const seedError = new Error("Seed failed.");
    const seed = vi.fn().mockRejectedValue(seedError);
    const exit = vi.fn();
    const logger = {
      error: vi.fn()
    };

    await runSeedCli({ seed, logger, exit });

    expect(exit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalledWith("Seed failed.", seedError);
  });
});
