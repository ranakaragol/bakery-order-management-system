import { body } from "express-validator";

export const categoryValidator = [
  body("name").trim().notEmpty().withMessage("Category name is required."),
  body("description").trim().notEmpty().withMessage("Category description is required."),
  body("imageUrl").trim().notEmpty().withMessage("Category image URL is required.")
];

export const productValidator = [
  body("name").trim().notEmpty().withMessage("Product name is required."),
  body("description").trim().notEmpty().withMessage("Product description is required."),
  body("price").isFloat({ min: 0 }).withMessage("Product price must be a positive number."),
  body("imageUrl").trim().notEmpty().withMessage("Product image URL is required."),
  body("category").trim().notEmpty().withMessage("Category ID is required."),
  body("stockQuantity")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock quantity must be zero or greater.")
];
