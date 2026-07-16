import { body } from "express-validator";
import { sanitizeQuantity } from "../../../shared/commerce.js";
import { isValidProvinceDistrictPair, normalizeProvinceValue } from "../../../shared/deliveryZones.js";

export const addToCartValidator = [
  body("productId").trim().notEmpty().withMessage("Ürün kimliği zorunludur."),
  body("variantId").optional({ values: "falsy" }).trim(),
  body("quantity")
    .optional()
    .customSanitizer((value) => sanitizeQuantity(value))
    .custom((value) => Number.isFinite(value) && value >= 0.1)
    .withMessage("Miktar en az 0.1 olmalıdır.")
];

export const updateCartItemValidator = [
  body("quantity")
    .customSanitizer((value) => sanitizeQuantity(value))
    .custom((value) => Number.isFinite(value) && value >= 0.1)
    .withMessage("Miktar en az 0.1 olmalıdır.")
];

export const createOrderValidator = [
  body("deliveryAddress.province").trim().notEmpty().withMessage("Teslimat ili zorunludur."),
  body("deliveryAddress.district").trim().notEmpty().withMessage("Teslimat ilçesi zorunludur."),
  body("deliveryAddress.neighborhood").trim().notEmpty().withMessage("Teslimat mahallesi zorunludur."),
  body("deliveryAddress.streetAddress").trim().notEmpty().withMessage("Teslimat açık adresi zorunludur."),
  body("deliveryAddress.addressTitle").optional({ values: "falsy" }).trim(),
  body("deliveryAddress.postalCode").optional({ values: "falsy" }).trim(),
  body("deliveryAddress")
    .custom((value = {}) => {
      const province = normalizeProvinceValue(value?.province);

      if (!province || !value?.district) {
        return true;
      }

      return isValidProvinceDistrictPair(province, value.district);
    })
    .withMessage("Teslimat ili ve ilçesi geçersiz veya birbiriyle uyumsuz."),
  body("notes").optional().isString().withMessage("Sipariş notu metin olmalıdır."),
  body("paymentMethod")
    .trim()
    .isIn(["bank_transfer", "cash_on_delivery"])
    .withMessage("Geçerli bir ödeme yöntemi seçilmelidir."),
  body("invoiceInfo.fullName")
    .trim()
    .notEmpty()
    .withMessage("Fatura ad soyad zorunludur."),
  body("invoiceInfo.companyName")
    .trim()
    .notEmpty()
    .withMessage("Şirket adı zorunludur."),
  body("invoiceInfo.taxNumber")
    .trim()
    .notEmpty()
    .withMessage("Vergi numarası zorunludur."),
  body("invoiceInfo.taxOffice")
    .trim()
    .notEmpty()
    .withMessage("Vergi dairesi zorunludur."),
  body("invoiceInfo.billingAddress")
    .trim()
    .notEmpty()
    .withMessage("Fatura adresi zorunludur."),
  body("invoiceInfo.phone")
    .trim()
    .notEmpty()
    .withMessage("Fatura telefonu zorunludur."),
  body("invoiceInfo.email")
    .trim()
    .notEmpty()
    .isEmail()
    .withMessage("Geçerli bir fatura e-postası zorunludur.")
];

export const statusValidator = [
  body("status")
    .isIn(["Hazirlaniyor", "Teslimata Cikti", "Tamamlandi", "Iptal Edildi"])
    .withMessage("Sipariş durumu geçersiz.")
];

export const contactValidator = [
  body("heroTitle").trim().notEmpty().withMessage("Hero başlığı zorunludur."),
  body("heroDescription").trim().notEmpty().withMessage("Hero açıklaması zorunludur."),
  body("phone").trim().notEmpty().withMessage("Telefon numarası zorunludur."),
  body("email").isEmail().withMessage("Geçerli bir e-posta adresi girilmelidir."),
  body("address").trim().notEmpty().withMessage("Adres zorunludur."),
  body("workingHours").trim().notEmpty().withMessage("Çalışma saatleri zorunludur."),
  body("aboutContent.titleTr").trim().notEmpty().withMessage("Türkçe hakkımızda başlığı zorunludur."),
  body("aboutContent.bodyTr").trim().notEmpty().withMessage("Türkçe hakkımızda metni zorunludur."),
  body("aboutContent.titleEn").trim().notEmpty().withMessage("İngilizce hakkımızda başlığı zorunludur."),
  body("aboutContent.bodyEn").trim().notEmpty().withMessage("İngilizce hakkımızda metni zorunludur."),
  body("paymentDetails.accountHolder").trim().notEmpty().withMessage("IBAN ad soyad bilgisi zorunludur."),
  body("paymentDetails.iban").trim().notEmpty().withMessage("IBAN bilgisi zorunludur."),
  body("paymentDetails.bankName").trim().notEmpty().withMessage("Banka adı zorunludur."),
  body("mapUrl").optional({ values: "falsy" }).trim()
];
