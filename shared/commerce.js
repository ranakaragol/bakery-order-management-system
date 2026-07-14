const KG_UNIT = "kg";
const KG_STEP = 0.1;
const KG_MINIMUM = 0.1;
const INTEGER_MINIMUM = 1;

const resolveUnitValue = (valueOrProduct = "") => {
  if (typeof valueOrProduct === "string") {
    return valueOrProduct;
  }

  return valueOrProduct?.unit || valueOrProduct?.unitSnapshot || "";
};

export const DELIVERY_FEE = 0;

export const roundQuantityTenth = (value = 0) => Math.round(Number(value || 0) * 10) / 10;

export const roundCurrencyValue = (value = 0) => Math.round(Number(value || 0) * 100) / 100;

export const sanitizeQuantity = (value = 0) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim().replace(/\s+/g, "").replace(/,/g, ".");

    if (!/^-?(?:\d+|\d*\.\d+)$/.test(normalizedValue)) {
      return Number.NaN;
    }

    const numericValue = Number(normalizedValue);

    return Number.isFinite(numericValue) ? numericValue : Number.NaN;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
};

export const normalizeUnit = (valueOrProduct = "") =>
  String(resolveUnitValue(valueOrProduct) || "")
    .trim()
    .toLocaleLowerCase("tr-TR");

export const isKilogramUnit = (valueOrProduct = "") => normalizeUnit(valueOrProduct) === KG_UNIT;

export const getQuantityStep = (valueOrProduct = "") => (isKilogramUnit(valueOrProduct) ? KG_STEP : 1);

export const getMinimumQuantity = (valueOrProduct = "") =>
  isKilogramUnit(valueOrProduct) ? KG_MINIMUM : INTEGER_MINIMUM;

export const getDefaultQuantity = () => 1;

export const normalizeQuantity = (value = 0, valueOrProduct = "") => {
  const numericValue = sanitizeQuantity(value);
  const minimumQuantity = getMinimumQuantity(valueOrProduct);

  if (!Number.isFinite(numericValue)) {
    return getDefaultQuantity();
  }

  if (isKilogramUnit(valueOrProduct)) {
    return Math.max(minimumQuantity, roundQuantityTenth(numericValue));
  }

  return Math.max(minimumQuantity, Math.round(numericValue));
};

export const isValidQuantityForUnit = (value = 0, valueOrProduct = "") => {
  const numericValue = sanitizeQuantity(value);

  if (!Number.isFinite(numericValue)) {
    return false;
  }

  const normalizedQuantity = normalizeQuantity(numericValue, valueOrProduct);

  if (isKilogramUnit(valueOrProduct)) {
    return Math.abs(normalizedQuantity - numericValue) < 0.000001;
  }

  return Number.isInteger(numericValue) && normalizedQuantity === numericValue;
};

export const incrementQuantity = (value = 0, valueOrProduct = "") =>
  normalizeQuantity(sanitizeQuantity(value) + getQuantityStep(valueOrProduct), valueOrProduct);

export const decrementQuantity = (value = 0, valueOrProduct = "") =>
  normalizeQuantity(sanitizeQuantity(value) - getQuantityStep(valueOrProduct), valueOrProduct);

export const calculateLineTotal = (unitPrice = 0, quantity = 0) =>
  roundCurrencyValue(Number(unitPrice || 0) * Number(quantity || 0));

export const calculateCartSubtotal = (items = []) =>
  roundCurrencyValue(
    items.reduce((total, item) => total + calculateLineTotal(item.unitPrice, item.quantity), 0)
  );

export const calculateCartItemCount = (items = []) =>
  roundQuantityTenth(items.reduce((total, item) => total + Number(item.quantity || 0), 0));

export const calculateDeliveryFee = () => DELIVERY_FEE;

export const calculateOrderTotal = (subtotal = 0, deliveryFee = DELIVERY_FEE) =>
  roundCurrencyValue(Number(subtotal || 0) + Number(deliveryFee || 0));
