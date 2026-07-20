import {
  createEmptyBillingAddress,
  createEmptyDeliveryAddress,
  getMissingBillingAddressFields,
  hasCompleteDeliveryAddress,
  mapInvoiceInfoToBillingAddress,
  mergeBillingAddressSources,
  normalizeBillingAddress,
  normalizeDeliveryAddress,
  resolveUserDeliveryAddress
} from "../../../shared/profile.js";

export const buildProfileForm = (user = null) => ({
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  email: user?.email || "",
  phone: user?.phone || "",
  deliveryAddress: resolveUserDeliveryAddress(user) || createEmptyDeliveryAddress(),
  billingAddress: normalizeBillingAddress(
    mergeBillingAddressSources(
      user?.billingAddress || createEmptyBillingAddress(),
      mapInvoiceInfoToBillingAddress(user?.invoiceInfo)
    )
  )
});

export const resolveCheckoutBillingAddress = (user = null, invoiceInfo = {}) =>
  normalizeBillingAddress(
    mergeBillingAddressSources(
      user?.billingAddress || createEmptyBillingAddress(),
      mapInvoiceInfoToBillingAddress(user?.invoiceInfo),
      mapInvoiceInfoToBillingAddress(invoiceInfo)
    )
  );

export const createEmptyCheckoutForm = () => ({
  deliveryAddress: createEmptyDeliveryAddress(),
  notes: "",
  paymentMethod: "",
  invoiceInfo: {
    fullName: "",
    companyName: "",
    taxNumber: "",
    taxOffice: "",
    identityNumber: "",
    billingAddress: "",
    phone: "",
    email: ""
  }
});

export const buildCheckoutForm = (
  user = null,
  currentForm = createEmptyCheckoutForm(),
  { preserveDeliveryAddress = false } = {}
) => {
  const billingAddress = mergeBillingAddressSources(
    user?.billingAddress,
    mapInvoiceInfoToBillingAddress(user?.invoiceInfo)
  );

  return {
    deliveryAddress: preserveDeliveryAddress
      ? normalizeDeliveryAddress(currentForm?.deliveryAddress)
      : resolveUserDeliveryAddress(user),
    notes: currentForm?.notes || "",
    paymentMethod: currentForm?.paymentMethod || "",
    invoiceInfo: {
      fullName: billingAddress.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      companyName: billingAddress.companyName || "",
      taxNumber: billingAddress.taxNumber || "",
      taxOffice: billingAddress.taxOffice || "",
      identityNumber: user?.invoiceInfo?.identityNumber || "",
      billingAddress: billingAddress.billingAddress || user?.address || "",
      phone: billingAddress.phone || user?.phone || "",
      email: billingAddress.email || user?.email || ""
    }
  };
};

export const getCheckoutValidationState = (form = createEmptyCheckoutForm(), user = null) => {
  const deliveryAddress = normalizeDeliveryAddress(form?.deliveryAddress);
  const billingAddress = resolveCheckoutBillingAddress(user, form?.invoiceInfo);
  const missingBillingFields = getMissingBillingAddressFields(billingAddress);

  return {
    deliveryAddress,
    billingAddress,
    missingBillingFields,
    isDeliveryAddressComplete: hasCompleteDeliveryAddress(deliveryAddress),
    isBillingAddressComplete: missingBillingFields.length === 0
  };
};
