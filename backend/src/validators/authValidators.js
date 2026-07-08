import { body } from "express-validator";

export const registerValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required."),
  body("lastName").trim().notEmpty().withMessage("Last name is required."),
  body("email").isEmail().withMessage("A valid email address is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("phone").trim().notEmpty().withMessage("Phone number is required."),
  body("address").trim().notEmpty().withMessage("Address is required.")
];

export const loginValidator = [
  body("email").isEmail().withMessage("A valid email address is required."),
  body("password").notEmpty().withMessage("Password is required.")
];

export const profileValidator = [
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty."),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty."),
  body("email").optional().isEmail().withMessage("Email must be valid."),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("phone").optional().trim().notEmpty().withMessage("Phone number cannot be empty."),
  body("address").optional().trim().notEmpty().withMessage("Address cannot be empty."),
  body("invoiceInfo.email")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Invoice email must be valid.")
];
