import { body } from "express-validator";

export const categoryValidator = [
  body("name").trim().notEmpty().withMessage("Kategori adı zorunludur."),
  body("slug").optional({ values: "falsy" }).trim().notEmpty().withMessage("Kategori slug değeri boş olamaz."),
  body("description").trim().notEmpty().withMessage("Kategori açıklaması zorunludur."),
  body("imageUrl").trim().notEmpty().withMessage("Kategori görsel yolu zorunludur."),
  body("sortOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Kategori sıralaması sıfır veya daha büyük bir sayı olmalıdır."),
  body("isActive").optional().isBoolean().withMessage("Kategori aktiflik durumu geçerli olmalıdır."),
  body("isFeatured").optional().isBoolean().withMessage("Kategori öne çıkarma durumu geçerli olmalıdır.")
];

export const productValidator = [
  body("name").trim().notEmpty().withMessage("Ürün adı zorunludur."),
  body("description").trim().notEmpty().withMessage("Ürün açıklaması zorunludur."),
  body("price")
    .optional({ values: "falsy" })
    .isFloat({ min: 0 })
    .withMessage("Ürün fiyatı sıfırdan küçük olamaz."),
  body("image")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Ürün görseli zorunludur."),
  body("imageUrl")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Ürün görsel yolu boş bırakılamaz."),
  body("category").trim().notEmpty().withMessage("Kategori seçimi zorunludur."),
  body("unit").trim().notEmpty().withMessage("Birim alanı zorunludur."),
  body("weight").optional().trim(),
  body("portion").optional().trim(),
  body("variants")
    .optional()
    .isArray()
    .withMessage("Varyant alanı geçerli bir liste olmalıdır."),
  body("variants.*.id")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Varyant kimliği boş bırakılamaz."),
  body("variants.*.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Varyant adı boş bırakılamaz."),
  body("variants.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Varyant fiyatı sıfırdan küçük olamaz."),
  body("shelfLife").trim().notEmpty().withMessage("Raf ömrü zorunludur."),
  body("storageCondition").trim().notEmpty().withMessage("Saklama koşulu zorunludur."),
  body("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stok miktarı sıfırdan küçük olamaz."),
  body("isActive").optional().isBoolean().withMessage("Aktiflik durumu geçerli olmalıdır.")
];
