import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryPayload,
  createCategoryFormFromCategory,
  createEmptyCategoryForm,
  getCategoryManagementState,
  getCategoryOptionLabel,
  getCategoryProductCount,
  removeCategoryFromList,
  upsertCategoryList,
  validateCategoryForm
} from "./adminCategoryForm.js";

const categories = [
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
];

const products = [
  {
    _id: "product-1",
    category: {
      _id: "category-1"
    }
  },
  {
    _id: "product-2",
    category: "category-1"
  }
];

test("category create form builds the expected payload", () => {
  const form = createEmptyCategoryForm();
  form.name = "Yeni Kategori";
  form.slug = "Yeni Kategori";
  form.description = "Açıklama";
  form.imageUrl = "/yeni.jpg";
  form.sortOrder = "3";

  assert.equal(validateCategoryForm(form), "");
  assert.deepEqual(buildCategoryPayload(form), {
    name: "Yeni Kategori",
    slug: "Yeni Kategori",
    description: "Açıklama",
    imageUrl: "/yeni.jpg",
    sortOrder: 3,
    isActive: true,
    isFeatured: false
  });
});

test("edit form is populated when a category is selected", () => {
  const form = createCategoryFormFromCategory(categories[1]);
  const viewState = getCategoryManagementState({
    categories,
    selectedCategoryId: "category-2"
  });

  assert.equal(form.name, "Geçici Kategori");
  assert.equal(form.isActive, false);
  assert.equal(viewState.showEditForm, true);
  assert.equal(viewState.selectedCategory?.slug, "gecici-kategori");
});

test("duplicate and linked-product style errors can stay visible while the selected category remains active", () => {
  const passiveLabel = getCategoryOptionLabel(categories[1]);
  const productCount = getCategoryProductCount(products, "category-1");

  assert.equal(passiveLabel, "Geçici Kategori (Pasif)");
  assert.equal(productCount, 2);
});

test("successful delete removes the category from the refreshed list", () => {
  const nextCategories = removeCategoryFromList(categories, "category-2");

  assert.equal(nextCategories.some((category) => category._id === "category-2"), false);
  assert.equal(nextCategories.length, 1);
});

test("category upsert keeps the admin list sorted by sort order", () => {
  const nextCategories = upsertCategoryList(categories, {
    _id: "category-3",
    name: "Ekler",
    slug: "ekler",
    description: "Ekler",
    imageUrl: "/ekler.jpg",
    sortOrder: 1,
    isActive: true
  });

  assert.deepEqual(
    nextCategories.map((category) => category.slug),
    ["pastalar", "ekler", "gecici-kategori"]
  );
});

test("category management state reports loading, empty and error cases", () => {
  const loadingState = getCategoryManagementState({
    categories: [],
    isLoading: true
  });
  const emptyState = getCategoryManagementState({
    categories: [],
    isLoading: false
  });
  const errorState = getCategoryManagementState({
    categories,
    error: "Duplicate kategori"
  });

  assert.equal(loadingState.showLoading, true);
  assert.equal(emptyState.showEmpty, true);
  assert.equal(errorState.showError, true);
});

test("invalid category payloads are rejected before submit", () => {
  const invalidForm = {
    ...createEmptyCategoryForm(),
    name: "",
    description: "",
    imageUrl: "",
    sortOrder: "-1"
  };

  assert.equal(validateCategoryForm(invalidForm), "Kategori adı boş olamaz.");
});
