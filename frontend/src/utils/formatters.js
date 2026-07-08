export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(value);

export const hasProductVariants = (product) => Array.isArray(product?.variants) && product.variants.length > 0;

export const canOrderProduct = (product) =>
  hasProductVariants(product) || (typeof product?.price === "number" && !Number.isNaN(product.price));

export const getVariantPriceRange = (product) => {
  if (!hasProductVariants(product)) {
    return null;
  }

  const prices = product.variants
    .map((variant) => Number(variant.price))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (!prices.length) {
    return null;
  }

  return {
    min: prices[0],
    max: prices[prices.length - 1]
  };
};

export const formatProductPrice = (product) => {
  if (product?.displayPrice) {
    return product.displayPrice;
  }

  const variantRange = getVariantPriceRange(product);

  if (variantRange) {
    return variantRange.min === variantRange.max
      ? formatCurrency(variantRange.min)
      : `${formatCurrency(variantRange.min)} - ${formatCurrency(variantRange.max)}`;
  }

  if (!canOrderProduct(product)) {
    return "Fiyat sorunuz";
  }

  return product?.unit ? `${formatCurrency(product.price)} / ${product.unit}` : formatCurrency(product.price);
};

export const getProductImage = (product) =>
  product?.image || product?.imageUrl || "/assets/products/catalog-placeholder.svg";

export const isTrayOnlyProduct = (product) => product?.unit === "Tepsi";

export const formatDate = (value) =>
  new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

const orderStatusLabels = {
  Hazirlaniyor: "Hazırlanıyor",
  "Teslimata Cikti": "Teslimata Çıktı",
  Tamamlandi: "Tamamlandı",
  "Iptal Edildi": "İptal Edildi"
};

export const formatOrderStatus = (value) => orderStatusLabels[value] || value;

export const stockLabels = {
  in_stock: "Stokta",
  limited: "Sınırlı",
  out_of_stock: "Tükendi"
};
