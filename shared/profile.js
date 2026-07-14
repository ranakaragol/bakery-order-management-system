export const billingAddressFields = [
  "fullName",
  "companyName",
  "taxOffice",
  "taxNumber",
  "email",
  "phone",
  "billingAddress"
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

export const normalizeProfileText = (value = "") => String(value || "").trim();

export const normalizeBillingAddress = (billingAddress = {}) =>
  billingAddressFields.reduce(
    (normalizedAddress, field) => ({
      ...normalizedAddress,
      [field]: normalizeProfileText(billingAddress?.[field])
    }),
    createEmptyBillingAddress()
  );

export const PROFILE_PHONE_PATTERN = /^[+]?[\d\s()\-]{10,20}$/;

export const isValidProfilePhone = (value = "") => PROFILE_PHONE_PATTERN.test(normalizeProfileText(value));

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
