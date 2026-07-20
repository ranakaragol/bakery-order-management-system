const normalizeSortOrderValue = (value) => {
  const trimmedValue = String(value ?? "").trim();

  if (!trimmedValue) {
    return 0;
  }

  return Number(trimmedValue);
};

export const sortAdminCategories = (categories = []) =>
  [...categories].sort((leftCategory, rightCategory) => {
    const sortOrderDifference =
      normalizeSortOrderValue(leftCategory?.sortOrder) - normalizeSortOrderValue(rightCategory?.sortOrder);

    if (sortOrderDifference !== 0) {
      return sortOrderDifference;
    }

    return String(leftCategory?.name || "").localeCompare(String(rightCategory?.name || ""), "tr");
  });

export const createEmptyCategoryForm = () => ({
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
  isActive: true,
  isFeatured: false
});

export const createCategoryFormFromCategory = (category = null) => ({
  ...createEmptyCategoryForm(),
  name: category?.name || "",
  slug: category?.slug || "",
  description: category?.description || "",
  imageUrl: category?.imageUrl || "",
  sortOrder: String(category?.sortOrder ?? 0),
  isActive: category?.isActive !== false,
  isFeatured: Boolean(category?.isFeatured)
});

export const validateCategoryForm = (form = {}) => {
  if (!String(form.name || "").trim()) {
    return "Kategori adı boş olamaz.";
  }

  if (!String(form.description || "").trim()) {
    return "Kategori açıklaması boş olamaz.";
  }

  if (!String(form.imageUrl || "").trim()) {
    return "Kategori görsel yolu boş olamaz.";
  }

  const sortOrder = normalizeSortOrderValue(form.sortOrder);

  if (!Number.isInteger(sortOrder) || sortOrder < 0) {
    return "Kategori sıralaması sıfır veya daha büyük bir tam sayı olmalıdır.";
  }

  return "";
};

export const buildCategoryPayload = (form = {}) => ({
  name: String(form.name || "").trim(),
  slug: String(form.slug || "").trim(),
  description: String(form.description || "").trim(),
  imageUrl: String(form.imageUrl || "").trim(),
  sortOrder: normalizeSortOrderValue(form.sortOrder),
  isActive: form.isActive !== false,
  isFeatured: Boolean(form.isFeatured)
});

export const getCategoryOptionLabel = (category = {}) =>
  category?.isActive === false ? `${category.name} (Pasif)` : category?.name || "";

export const getCategoryProductCount = (products = [], categoryId = "") =>
  products.filter((product) => (product.category?._id || product.category) === categoryId).length;

export const upsertCategoryList = (categories = [], category) =>
  sortAdminCategories(
    [...categories.filter((existingCategory) => existingCategory._id !== category?._id), category].filter(Boolean)
  );

export const removeCategoryFromList = (categories = [], categoryId = "") =>
  sortAdminCategories(categories.filter((category) => category._id !== categoryId));

export const getCategoryManagementState = ({
  categories = [],
  isLoading = false,
  error = "",
  selectedCategoryId = ""
} = {}) => {
  const selectedCategory = categories.find((category) => category._id === selectedCategoryId) || null;

  return {
    selectedCategory,
    showLoading: isLoading,
    showError: !isLoading && Boolean(error),
    showEmpty: !isLoading && !error && categories.length === 0,
    showEditForm: Boolean(selectedCategory)
  };
};
