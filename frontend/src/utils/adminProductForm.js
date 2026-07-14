const DEFAULT_STORAGE_CONDITION = "+4/+6 Buzdolabı";
const DEFAULT_SHELF_LIFE = "3-4 Gün";
const DEFAULT_CAKE_SHELF_LIFE = "2-3 Gün";

const defaultVariantTemplate = [
  { id: "tek", name: "Tek Pasta", price: 125 },
  { id: "0-no", name: "0 No Pasta", price: 420 },
  { id: "1-no", name: "1 No Pasta", price: 550 },
  { id: "2-no", name: "2 No Pasta", price: 650 }
];

const baseCategoryConfig = {
  unitOptions: ["Adet"],
  defaultUnit: "Adet",
  usesVariants: false,
  showWeightField: true,
  showPortionField: true,
  defaultShelfLife: DEFAULT_SHELF_LIFE,
  defaultStorageCondition: DEFAULT_STORAGE_CONDITION,
  directPriceLabel: "Fiyat",
  helperText: "",
  categorySummary: "",
  variantTitle: "Varyant seçenekleri"
};

export const categoryFormConfig = {
  pastalar: {
    unitOptions: ["Adet"],
    defaultUnit: "Adet",
    usesVariants: true,
    showWeightField: false,
    showPortionField: true,
    defaultShelfLife: DEFAULT_CAKE_SHELF_LIFE,
    directPriceLabel: "Ana fiyat kullanılmıyor",
    helperText: "Pastalar için boy seçenekleri ve her boyun fiyatı zorunludur.",
    categorySummary: "Tek / 0 No / 1 No / 2 No pasta boylarıyla satılır.",
    variantTitle: "Boy fiyatları"
  },
  ekler: {
    unitOptions: ["Kg"],
    defaultUnit: "Kg",
    showWeightField: true,
    showPortionField: false,
    directPriceLabel: "Kilogram fiyatı",
    helperText: "Ekler ürünlerinde kilogram fiyatı kullanılır. Ondalıklı fiyat girebilirsiniz.",
    categorySummary: "Bu kategori kilogram bazlı satılır."
  },
  petifur: {
    unitOptions: ["Tepsi"],
    defaultUnit: "Tepsi",
    showWeightField: true,
    showPortionField: false,
    directPriceLabel: "Tepsi fiyatı",
    helperText: "Petifür ürünleri tepsi bazlı fiyatlandırılır.",
    categorySummary: "Bu kategori varsayılan olarak tepsi bazlıdır."
  },
  marki: {
    unitOptions: ["Tepsi"],
    defaultUnit: "Tepsi",
    showWeightField: true,
    showPortionField: false,
    directPriceLabel: "Tepsi fiyatı",
    helperText: "Marki ürünleri tepsi bazlı fiyatlandırılır."
  },
  rulo: {
    unitOptions: ["Tepsi"],
    defaultUnit: "Tepsi",
    showWeightField: true,
    showPortionField: false,
    directPriceLabel: "Tepsi fiyatı",
    helperText: "Rulo ürünleri tepsi bazlı fiyatlandırılır."
  },
  "cup-tatlilar": {
    unitOptions: ["Adet"],
    defaultUnit: "Adet",
    showWeightField: false,
    showPortionField: false,
    directPriceLabel: "Adet fiyatı",
    helperText: "Cup tatlılar adet bazlı satılır."
  },
  cheesecake: {
    unitOptions: ["Adet"],
    defaultUnit: "Adet",
    showWeightField: false,
    showPortionField: true,
    directPriceLabel: "Adet fiyatı",
    helperText: "Cheesecake ürünleri dilim veya adet bazlı fiyatlandırılır."
  },
  "tepsi-tatlilari": {
    unitOptions: ["Tepsi", "Kg"],
    defaultUnit: "Tepsi",
    showWeightField: true,
    showPortionField: false,
    directPriceLabel: "Fiyat",
    helperText: "Tepsi Tatlıları kategorisinde tepsi veya kilogram birimini seçebilirsiniz."
  }
};

export const buildDefaultVariants = () =>
  defaultVariantTemplate.map((variant) => ({
    ...variant
  }));

export const getCategoryProductConfig = (category) => {
  const categorySlug = String(category?.slug || "").trim();

  return {
    ...baseCategoryConfig,
    ...(categoryFormConfig[categorySlug] || {})
  };
};

export const createEmptyProductForm = (category = null) => {
  const config = getCategoryProductConfig(category);

  return {
    name: "",
    description: "",
    price: "",
    image: "",
    category: category?._id || "",
    unit: config.defaultUnit,
    weight: "",
    portion: "",
    shelfLife: config.defaultShelfLife,
    storageCondition: config.defaultStorageCondition,
    stockStatus: "in_stock",
    stockQuantity: 0,
    featured: false,
    isActive: true,
    variants: buildDefaultVariants()
  };
};

export const createProductFormFromProduct = (product, category = null) => {
  const resolvedCategory = category || product?.category || null;
  const config = getCategoryProductConfig(resolvedCategory);

  return {
    ...createEmptyProductForm(resolvedCategory),
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price ?? "",
    image: product?.image || product?.imageUrl || "",
    category: product?.category?._id || product?.category || resolvedCategory?._id || "",
    unit: product?.unit || config.defaultUnit,
    weight: product?.weight || "",
    portion: product?.portion || "",
    shelfLife: product?.shelfLife || config.defaultShelfLife,
    storageCondition: product?.storageCondition || config.defaultStorageCondition,
    stockStatus: product?.stockStatus || "in_stock",
    stockQuantity: product?.stockQuantity ?? 0,
    featured: Boolean(product?.featured),
    isActive: product?.isActive !== false,
    variants:
      Array.isArray(product?.variants) && product.variants.length
        ? product.variants.map((variant) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price
          }))
        : buildDefaultVariants()
  };
};

export const applyCategoryConfigToForm = (form, category = null) => {
  const config = getCategoryProductConfig(category);

  return {
    ...form,
    category: category?._id || form.category || "",
    unit: config.unitOptions.includes(form.unit) ? form.unit : config.defaultUnit,
    price: config.usesVariants ? "" : form.price,
    weight: config.showWeightField ? form.weight : "",
    portion: config.showPortionField ? form.portion : "",
    shelfLife: form.shelfLife || config.defaultShelfLife,
    storageCondition: form.storageCondition || config.defaultStorageCondition,
    variants: config.usesVariants ? normalizeVariantInputs(form.variants) : buildDefaultVariants()
  };
};

export const normalizeVariantInputs = (variants = []) => {
  const fallbackVariants = buildDefaultVariants();

  return fallbackVariants.map((fallbackVariant, index) => {
    const nextVariant = variants[index] || {};

    return {
      id: nextVariant.id || fallbackVariant.id,
      name: nextVariant.name || fallbackVariant.name,
      price: nextVariant.price ?? fallbackVariant.price
    };
  });
};

export const validateProductForm = (form, category = null) => {
  const config = getCategoryProductConfig(category);
  const normalizedName = String(form.name || "").trim();
  const normalizedDescription = String(form.description || "").trim();
  const normalizedUnit = String(form.unit || "").trim();
  const normalizedShelfLife = String(form.shelfLife || "").trim();
  const normalizedStorageCondition = String(form.storageCondition || "").trim();
  const stockQuantity = Number(form.stockQuantity);

  if (!form.category) {
    return "Kategori seçilmeden ürün işlemi yapılamaz.";
  }

  if (!normalizedName) {
    return "Ürün adı boş olamaz.";
  }

  if (!normalizedDescription) {
    return "Ürün açıklaması boş olamaz.";
  }

  if (!config.unitOptions.includes(normalizedUnit)) {
    return "Seçilen birim bu kategoriyle uyumlu değil.";
  }

  if (!normalizedShelfLife || !normalizedStorageCondition) {
    return "Raf ömrü ve saklama koşulu alanları zorunludur.";
  }

  if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return "Stok miktarı sıfır veya daha büyük bir tam sayı olmalıdır.";
  }

  if (config.usesVariants) {
    const validVariants = normalizeVariantInputs(form.variants).filter(
      (variant) => String(variant.name || "").trim() && Number(variant.price) > 0
    );

    if (!validVariants.length) {
      return "Pastalar için en az bir boyut ve fiyat seçeneği girilmelidir.";
    }
  } else {
    const numericPrice = Number(form.price);

    if (!Number.isFinite(numericPrice)) {
      return "Fiyat geçerli bir sayı olmalıdır.";
    }

    if (numericPrice <= 0) {
      return "Fiyat sıfırdan büyük olmalıdır.";
    }
  }

  return "";
};

export const buildProductPayload = (form, category = null) => {
  const config = getCategoryProductConfig(category);
  const fallbackImage = category?.imageUrl || "";
  const normalizedImage = String(form.image || "").trim() || fallbackImage;

  return {
    ...form,
    image: normalizedImage,
    category: form.category,
    unit: config.unitOptions.includes(form.unit) ? form.unit : config.defaultUnit,
    price: config.usesVariants ? "" : Number(form.price),
    weight: config.showWeightField ? String(form.weight || "").trim() : "",
    portion: config.showPortionField ? String(form.portion || "").trim() : "",
    shelfLife: String(form.shelfLife || "").trim(),
    storageCondition: String(form.storageCondition || "").trim(),
    stockQuantity: Number(form.stockQuantity),
    isActive: form.isActive !== false,
    variants: config.usesVariants
      ? normalizeVariantInputs(form.variants).map((variant) => ({
          ...variant,
          price: Number(variant.price)
        }))
      : []
  };
};

export const filterProductsByCategory = (products = [], categoryId = "") =>
  products.filter((product) => (product.category?._id || product.category) === categoryId);

export const filterProductsBySearch = (products = [], searchTerm = "") => {
  const normalizedSearch = String(searchTerm || "").trim().toLocaleLowerCase("tr-TR");

  if (!normalizedSearch) {
    return products;
  }

  return products.filter((product) =>
    `${product.name} ${product.description}`.toLocaleLowerCase("tr-TR").includes(normalizedSearch)
  );
};
