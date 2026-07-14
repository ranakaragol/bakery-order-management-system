const GENERIC_ADDRESS_PATTERN = /iletisime gecin|iletişime geçin|teyidi/i;
export const PASALI_INSTAGRAM_URL = "https://www.instagram.com/toptanpastacin?utm_source=qr";

export const buildPhoneHref = (value = "") => {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return `tel:+${digits.startsWith("90") ? digits : `90${digits}`}`;
};

export const buildMailHref = (value = "") => (value ? `mailto:${value}` : "");

export const buildWhatsappHref = (value = "") => {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace("http://", "https://");
  }

  const digits = value.replace(/\D/g, "");

  return digits ? `https://wa.me/${digits.startsWith("90") ? digits : `90${digits}`}` : "";
};

export const buildInstagramHref = (value = "") => {
  if (!value) {
    return "";
  }

  if (value === PASALI_INSTAGRAM_URL) {
    return PASALI_INSTAGRAM_URL;
  }

  const normalized = value
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "")
    .split("?")[0]
    .trim();

  if (normalized.toLocaleLowerCase("tr-TR") === "toptanpastacin") {
    return PASALI_INSTAGRAM_URL;
  }

  return normalized ? `https://www.instagram.com/${normalized}` : "";
};

export const buildFacebookHref = (value = "") => {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace("http://", "https://");
  }

  const normalized = value
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, "")
    .replace(/^facebook\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");

  return normalized ? `https://www.facebook.com/${normalized}` : "";
};

export const buildXHref = (value = "") => {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace("http://", "https://");
  }

  const normalized = value
    .replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "")
    .replace(/^(x|twitter)\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");

  return normalized ? `https://x.com/${normalized}` : "";
};

export const buildAddressHref = (address = "", explicitMapUrl = "") => {
  if (explicitMapUrl) {
    return explicitMapUrl;
  }

  if (!address || GENERIC_ADDRESS_PATTERN.test(address)) {
    return "";
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};
