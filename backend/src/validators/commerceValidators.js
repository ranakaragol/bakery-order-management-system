import { body } from "express-validator";

export const addToCartValidator = [
  body("productId").trim().notEmpty().withMessage("Ürün kimliği zorunludur."),
  body("variantId").optional({ values: "falsy" }).trim(),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Adet en az 1 olmalıdır.")
];

export const updateCartItemValidator = [
  body("quantity").isInt({ min: 1 }).withMessage("Adet en az 1 olmalıdır.")
];

export const createOrderValidator = [
  body("address").trim().notEmpty().withMessage("Teslimat adresi zorunludur."),
  body("notes").optional().isString().withMessage("Sipariş notu metin olmalıdır."),
  body("invoiceInfo.fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Fatura adı boş bırakılamaz."),
  body("invoiceInfo.billingAddress")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Fatura adresi boş bırakılamaz.")
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
  body("mapUrl").optional({ values: "falsy" }).trim()
];
