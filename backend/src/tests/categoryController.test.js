import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  categoryFind: vi.fn(),
  categoryCreate: vi.fn(),
  categoryFindById: vi.fn(),
  productCountDocuments: vi.fn(),
  ensureCatalogDataSynchronized: vi.fn()
}));

vi.mock("../models/Category.js", () => ({
  default: {
    find: mocks.categoryFind,
    create: mocks.categoryCreate,
    findById: mocks.categoryFindById
  }
}));

vi.mock("../models/Product.js", () => ({
  default: {
    countDocuments: mocks.productCountDocuments
  }
}));

vi.mock("../utils/catalogSync.js", () => ({
  ensureCatalogDataSynchronized: mocks.ensureCatalogDataSynchronized
}));

const {
  createCategory,
  deleteCategory,
  getAdminCategories,
  getCategories,
  updateCategory
} = await import("../controllers/categoryController.js");

const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: undefined,
    status: vi.fn((code) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((payload) => {
      response.payload = payload;
      return response;
    })
  };

  return response;
};

describe("category controller", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mockFn) => mockFn.mockReset());
    mocks.ensureCatalogDataSynchronized.mockResolvedValue(undefined);
  });

  it("keeps inactive categories out of the customer listing", async () => {
    const response = createResponse();
    mocks.categoryFind.mockResolvedValue([
      {
        _id: "category-2",
        name: "Ekler",
        slug: "ekler",
        description: "Ekler",
        imageUrl: "/ekler.jpg",
        sortOrder: 2,
        isActive: true
      },
      {
        _id: "category-1",
        name: "Pastalar",
        slug: "pastalar",
        description: "Pastalar",
        imageUrl: "/pastalar.jpg",
        sortOrder: 0,
        isActive: true
      }
    ]);

    await getCategories({}, response, vi.fn());

    expect(mocks.categoryFind).toHaveBeenCalledWith({ isActive: { $ne: false } });
    expect(response.payload.map((category) => category.name)).toEqual(["Pastalar", "Ekler"]);
    expect(response.payload.every((category) => category.isActive !== false)).toBe(true);
  });

  it("keeps inactive categories in the admin listing", async () => {
    const response = createResponse();
    mocks.categoryFind.mockResolvedValue([
      {
        _id: "category-1",
        name: "Pastalar",
        slug: "pastalar",
        description: "Pastalar",
        imageUrl: "/pastalar.jpg",
        sortOrder: 0,
        isActive: true
      },
      {
        _id: "category-2",
        name: "Geçici Kategori",
        slug: "gecici-kategori",
        description: "Geçici",
        imageUrl: "/gecici.jpg",
        sortOrder: 4,
        isActive: false
      }
    ]);

    await getAdminCategories({}, response, vi.fn());

    expect(mocks.categoryFind).toHaveBeenCalledWith({});
    expect(response.payload).toHaveLength(2);
    expect(response.payload.some((category) => category.slug === "gecici-kategori" && category.isActive === false)).toBe(
      true
    );
  });

  it("allows admins to create categories with slug, order and status", async () => {
    const response = createResponse();
    mocks.categoryCreate.mockResolvedValue({
      _id: "category-1",
      name: "Yeni Kategori",
      slug: "yeni-kategori",
      description: "Açıklama",
      imageUrl: "/yeni.jpg",
      sortOrder: 7,
      isActive: false,
      isFeatured: true
    });

    await createCategory(
      {
        body: {
          name: "Yeni Kategori",
          slug: "Yeni Kategori",
          description: "Açıklama",
          imageUrl: "/yeni.jpg",
          sortOrder: "7",
          isActive: false,
          isFeatured: true
        }
      },
      response,
      vi.fn()
    );

    expect(mocks.categoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Yeni Kategori",
        slug: "yeni-kategori",
        sortOrder: 7,
        isActive: false,
        isFeatured: true
      })
    );
    expect(response.statusCode).toBe(201);
    expect(response.payload.category.slug).toBe("yeni-kategori");
  });

  it("updates an existing category", async () => {
    const response = createResponse();
    const category = {
      _id: "category-1",
      name: "Eski Kategori",
      slug: "eski-kategori",
      description: "Eski açıklama",
      imageUrl: "/eski.jpg",
      sortOrder: 1,
      isActive: true,
      save: vi.fn().mockResolvedValue(undefined)
    };
    mocks.categoryFindById.mockResolvedValue(category);

    await updateCategory(
      {
        params: { id: "category-1" },
        body: {
          name: "Yeni Kategori",
          description: "Yeni açıklama",
          imageUrl: "/yeni.jpg",
          sortOrder: "5",
          isActive: false
        }
      },
      response,
      vi.fn()
    );

    expect(category.name).toBe("Yeni Kategori");
    expect(category.slug).toBe("yeni-kategori");
    expect(category.sortOrder).toBe(5);
    expect(category.isActive).toBe(false);
    expect(category.save).toHaveBeenCalled();
    expect(response.payload.category.slug).toBe("yeni-kategori");
  });

  it("blocks deleting categories that still have products and returns a 409 response", async () => {
    const response = createResponse();
    mocks.categoryFindById.mockResolvedValue({
      _id: "category-1",
      deleteOne: vi.fn()
    });
    mocks.productCountDocuments.mockResolvedValue(3);

    await deleteCategory(
      {
        params: { id: "category-1" }
      },
      response,
      vi.fn()
    );

    expect(response.statusCode).toBe(409);
    expect(response.payload).toEqual({
      success: false,
      message: "Bu kategori silinemiyor. Önce kategoriye bağlı 3 ürünü kaldırın veya taşıyın.",
      code: "CATEGORY_HAS_PRODUCTS",
      linkedProductCount: 3
    });
  });

  it("deletes an empty category", async () => {
    const response = createResponse();
    const category = {
      _id: "category-1",
      deleteOne: vi.fn().mockResolvedValue(undefined)
    };
    mocks.categoryFindById.mockResolvedValue(category);
    mocks.productCountDocuments.mockResolvedValue(0);

    await deleteCategory(
      {
        params: { id: "category-1" }
      },
      response,
      vi.fn()
    );

    expect(category.deleteOne).toHaveBeenCalled();
    expect(response.payload).toEqual({
      message: "Kategori başarıyla silindi."
    });
  });
});
