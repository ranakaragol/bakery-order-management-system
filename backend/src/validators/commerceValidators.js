import { body } from "express-validator";

export const addToCartValidator = [
  body("productId").trim().notEmpty().withMessage("Product ID is required."),
  body("quantity").optional().isInt({ min: 1 }).withMessage("Quantity must be at least 1.")
];

export const updateCartItemValidator = [
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be at least 1.")
];

export const createOrderValidator = [
  body("address").trim().notEmpty().withMessage("Delivery address is required."),
  body("notes").optional().isString().withMessage("Order note must be text."),
  body("invoiceInfo.fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Invoice full name cannot be empty."),
  body("invoiceInfo.billingAddress")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Invoice billing address cannot be empty.")
];

export const statusValidator = [
  body("status")
    .isIn(["Hazirlaniyor", "Teslimata Cikti", "Tamamlandi", "Iptal Edildi"])
    .withMessage("Order status is invalid.")
];

export const contactValidator = [
  body("heroTitle").trim().notEmpty().withMessage("Hero title is required."),
  body("heroDescription").trim().notEmpty().withMessage("Hero description is required."),
  body("phone").trim().notEmpty().withMessage("Phone number is required."),
  body("email").isEmail().withMessage("A valid email address is required."),
  body("address").trim().notEmpty().withMessage("Address is required."),
  body("workingHours").trim().notEmpty().withMessage("Working hours are required.")
];
