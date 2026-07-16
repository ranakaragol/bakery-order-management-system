import {
  formatDistrictLabel,
  formatProvinceLabel,
  isValidProvinceDistrictPair,
  normalizeDistrictValue,
  normalizeProvinceValue,
  parseLegacyDeliveryAddressText
} from "./deliveryZones.js";

export const billingAddressFields = [
  "fullName",
  "companyName",
  "taxOffice",
  "taxNumber",
  "email",
  "phone",
  "billingAddress"
];

export const deliveryAddressFields = [
  "addressTitle",
  "province",
  "district",
  "neighborhood",
  "streetAddress",
  "postalCode"
];

export const createEmptyBillingAddress = () => ({
  fullName: "",
  companyName: "",
  taxOffice: "",
  taxNumber: "",
  email: "",
  phone: "",
  billingAddress: ""
});

export const createEmptyDeliveryAddress = () => ({
  addressTitle: "",
  province: "",
  district: "",
  neighborhood: "",
  streetAddress: "",
  postalCode: ""
});

export const normalizeProfileText = (value = "") => String(value || "").trim();

const containsLabel = (text = "", label = "") =>
  normalizeProfileText(text).toLocaleLowerCase("tr-TR").includes(normalizeProfileText(label).toLocaleLowerCase("tr-TR"));

const getFirstDefinedValue = (source = {}, keys = []) =>
  keys.reduce((resolvedValue, key) => resolvedValue || source?.[key], "");

const inferNeighborhoodFromLegacyText = (text = "") => {
  const normalizedText = normalizeProfileText(text);

  if (!normalizedText) {
    return "";
  }

  const match = normalizedText.match(
    /\b([A-Za-z0-9ÇĞİÖŞÜçğıöşü.\- ]{2,}?)(?:\s+(Mahallesi|Mah\.|Mah|Mh\.|Mh|Köyü|Koyu))\b/u
  );

  if (!match) {
    return "";
  }

  const baseValue = normalizeProfileText(match[1]).replace(/[.,]$/u, "");
  const suffix = normalizeProfileText(match[2]);

  return [baseValue, suffix].filter(Boolean).join(" ");
};

const inferPostalCodeFromLegacyText = (text = "") => {
  const normalizedText = normalizeProfileText(text);
  const match = normalizedText.match(/\b(\d{5})\b/u);

  return match ? match[1] : "";
};

export const normalizeBillingAddress = (billingAddress = {}) =>
  billingAddressFields.reduce(
    (normalizedAddress, field) => ({
      ...normalizedAddress,
      [field]: normalizeProfileText(billingAddress?.[field])
    }),
    createEmptyBillingAddress()
  );

export const normalizeDeliveryAddress = (deliveryAddress = {}, fallbackLegacyAddress = "") => {
  const source =
    typeof deliveryAddress === "string"
      ? {
          streetAddress: deliveryAddress
        }
      : deliveryAddress || {};
  const legacyText =
    normalizeProfileText(source.legacyAddress || "") ||
    normalizeProfileText(fallbackLegacyAddress) ||
    normalizeProfileText(
      getFirstDefinedValue(source, ["streetAddress", "openAddress", "addressLine", "address", "acikAdres"])
    );
  const legacyMatch = parseLegacyDeliveryAddressText(legacyText);
  const province = normalizeProvinceValue(getFirstDefinedValue(source, ["province", "city", "il"]) || legacyMatch.province);
  const district = normalizeDistrictValue(
    province,
    getFirstDefinedValue(source, ["district", "county", "ilce"]) || legacyMatch.district
  );

  return {
    addressTitle: normalizeProfileText(getFirstDefinedValue(source, ["addressTitle", "title", "adresBasligi"])),
    province,
    district: isValidProvinceDistrictPair(province, district) ? district : "",
    neighborhood: normalizeProfileText(
      getFirstDefinedValue(source, ["neighborhood", "mahalle", "neighbourhood"]) ||
        inferNeighborhoodFromLegacyText(legacyText)
    ),
    streetAddress: normalizeProfileText(
      getFirstDefinedValue(source, ["streetAddress", "openAddress", "addressLine", "address", "acikAdres"]) ||
        legacyText
    ),
    postalCode: normalizeProfileText(
      getFirstDefinedValue(source, ["postalCode", "postCode", "zipCode", "postaKodu"]) ||
        inferPostalCodeFromLegacyText(legacyText)
    )
  };
};

export const formatDeliveryAddress = (deliveryAddress = {}) => {
  const normalizedAddress = normalizeDeliveryAddress(deliveryAddress);
  const provinceLabel = formatProvinceLabel(normalizedAddress.province);
  const districtLabel = formatDistrictLabel(normalizedAddress.province, normalizedAddress.district);
  const addressTitle = normalizeProfileText(normalizedAddress.addressTitle);
  const neighborhood = normalizeProfileText(normalizedAddress.neighborhood);
  const streetAddress = normalizeProfileText(normalizedAddress.streetAddress);
  const postalCode = normalizeProfileText(normalizedAddress.postalCode);

  if (!addressTitle && !streetAddress && !neighborhood && !districtLabel && !provinceLabel && !postalCode) {
    return "";
  }

  if (streetAddress && containsLabel(streetAddress, districtLabel) && containsLabel(streetAddress, provinceLabel)) {
    return [addressTitle, streetAddress].filter(Boolean).join(" - ");
  }

  const lineParts = [addressTitle, neighborhood, streetAddress].filter(Boolean);
  const cityLabel = [districtLabel, provinceLabel].filter(Boolean).join(" / ");
  const locationLine = postalCode && cityLabel ? `${postalCode} ${cityLabel}` : postalCode || cityLabel;

  return [...lineParts, locationLine].filter(Boolean).join(", ");
};

export const hasCompleteDeliveryAddress = (deliveryAddress = {}) => {
  const normalizedAddress = normalizeDeliveryAddress(deliveryAddress);

  return (
    Boolean(normalizedAddress.province) &&
    Boolean(normalizedAddress.district) &&
    Boolean(normalizedAddress.neighborhood) &&
    Boolean(normalizedAddress.streetAddress) &&
    isValidProvinceDistrictPair(normalizedAddress.province, normalizedAddress.district)
  );
};

export const mapInvoiceInfoToBillingAddress = (invoiceInfo = {}) =>
  normalizeBillingAddress({
    fullName: invoiceInfo?.fullName,
    companyName: invoiceInfo?.companyName,
    taxOffice: invoiceInfo?.taxOffice,
    taxNumber: invoiceInfo?.taxNumber,
    email: invoiceInfo?.email,
    phone: invoiceInfo?.phone,
    billingAddress: invoiceInfo?.billingAddress
  });

export const mapBillingAddressToInvoiceInfo = (billingAddress = {}, existingInvoiceInfo = {}) => {
  const normalizedAddress = normalizeBillingAddress(billingAddress);

  return {
    fullName: normalizedAddress.fullName,
    companyName: normalizedAddress.companyName,
    taxOffice: normalizedAddress.taxOffice,
    taxNumber: normalizedAddress.taxNumber,
    email: normalizedAddress.email,
    phone: normalizedAddress.phone,
    billingAddress: normalizedAddress.billingAddress,
    identityNumber: normalizeProfileText(existingInvoiceInfo?.identityNumber)
  };
};

export const mergeBillingAddressSources = (...sources) => {
  const mergedAddress = createEmptyBillingAddress();

  sources.forEach((source) => {
    const normalizedSource = normalizeBillingAddress(source);

    billingAddressFields.forEach((field) => {
      if (!mergedAddress[field] && normalizedSource[field]) {
        mergedAddress[field] = normalizedSource[field];
      }
    });
  });

  return normalizeBillingAddress(mergedAddress);
};

export const hasCompleteBillingAddress = (billingAddress = {}) => {
  const normalizedAddress = normalizeBillingAddress(billingAddress);

  return billingAddressFields.every((field) => normalizedAddress[field]);
};

export const resolveUserDeliveryAddress = (user = {}) =>
  normalizeDeliveryAddress(user?.deliveryAddress, user?.address || "");

export const buildUserAddressSummary = (user = {}) =>
  formatDeliveryAddress(resolveUserDeliveryAddress(user)) || normalizeProfileText(user?.address);

export const PROFILE_PHONE_PATTERN = /^[+]?[\d\s()\-]{10,20}$/;

export const isValidProfilePhone = (value = "") => PROFILE_PHONE_PATTERN.test(normalizeProfileText(value));
