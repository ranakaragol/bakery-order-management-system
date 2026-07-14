import {
  DELIVERY_FEE,
  calculateLineTotal,
  isKilogramUnit,
  normalizeUnit
} from "../../../shared/commerce.js";

export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(value);

export const formatQuantityValue = (value = 0) =>
  new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(Number(value || 0));

export const formatUnitLabel = (unit = "") => {
  if (isKilogramUnit(unit)) {
    return "kg";
  }

  const normalizedUnit = normalizeUnit(unit);

  return normalizedUnit || String(unit || "").trim();
};

export const formatQuantity = (value = 0, unit = "", includeUnit = true) => {
  const formattedValue = formatQuantityValue(value);

  if (!includeUnit) {
    return formattedValue;
  }

  const unitLabel = formatUnitLabel(unit);

  return unitLabel ? `${formattedValue} ${unitLabel}` : formattedValue;
};

export const formatUnitPrice = (value = 0, unit = "") => {
  if (!Number.isFinite(Number(value))) {
    return "Fiyat sorunuz";
  }

  const unitLabel = formatUnitLabel(unit);

  return unitLabel ? `${formatCurrency(value)} / ${unitLabel}` : formatCurrency(value);
};

export const formatLineTotal = (unitPrice = 0, quantity = 0) => formatCurrency(calculateLineTotal(unitPrice, quantity));

export const formatDeliveryFee = (value = DELIVERY_FEE) => (Number(value || 0) === 0 ? "Ücretsiz" : formatCurrency(value));

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

  return product?.unit ? formatUnitPrice(product.price, product.unit) : formatCurrency(product.price);
};

export const getProductImage = (product) =>
  product?.image || product?.imageUrl || "/assets/products/catalog-placeholder.svg";

export const isTrayOnlyProduct = (product) => normalizeUnit(product?.unit) === "tepsi";

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

const paymentMethodLabels = {
  bank_transfer: "Havale & EFT",
  cash_on_delivery: "Teslimatta Nakit Ödeme"
};

export const formatPaymentMethod = (value) => paymentMethodLabels[value] || value;

const paymentStatusLabels = {
  paid: "Ödendi",
  unpaid: "Ödeme Bekleniyor"
};

export const formatPaymentStatus = (value) => paymentStatusLabels[value] || value;

export const stockLabels = {
  in_stock: "Stokta",
  limited: "Sınırlı",
  out_of_stock: "Tükendi"
};
