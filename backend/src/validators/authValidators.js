import { body } from "express-validator";
import {
  billingAddressFields,
  isValidProfilePhone
} from "../../../shared/profile.js";
import { isValidProvinceDistrictPair, normalizeProvinceValue } from "../../../shared/deliveryZones.js";

export const registerValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required."),
  body("lastName").trim().notEmpty().withMessage("Last name is required."),
  body("email").isEmail().withMessage("A valid email address is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("phone").trim().notEmpty().withMessage("Phone number is required."),
  body("deliveryAddress.province").trim().notEmpty().withMessage("Province is required."),
  body("deliveryAddress.district").trim().notEmpty().withMessage("District is required."),
  body("deliveryAddress.neighborhood").trim().notEmpty().withMessage("Neighborhood is required."),
  body("deliveryAddress.streetAddress").trim().notEmpty().withMessage("Street address is required."),
  body("deliveryAddress.addressTitle").optional({ values: "falsy" }).trim(),
  body("deliveryAddress.postalCode").optional({ values: "falsy" }).trim(),
  body("deliveryAddress").custom((value = {}) => {
    const province = normalizeProvinceValue(value?.province);

    if (!province || !value?.district) {
      return true;
    }

    return isValidProvinceDistrictPair(province, value.district);
  }).withMessage("Province and district combination is invalid.")
];

export const loginValidator = [
  body("email").isEmail().withMessage("A valid email address is required."),
  body("password").notEmpty().withMessage("Password is required.")
];

export const profileValidator = [
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty."),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty."),
  body("email").optional().isEmail().withMessage("Email must be valid."),
  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty.")
    .bail()
    .custom((value) => isValidProfilePhone(value))
    .withMessage("Phone number format is invalid."),
  body("address").optional().trim().notEmpty().withMessage("Address cannot be empty."),
  body("deliveryAddress")
    .optional()
    .custom((value) => {
      if (!value) {
        return true;
      }

      return Boolean(value.province && value.district && value.neighborhood && value.streetAddress);
    })
    .withMessage("Province, district, neighborhood and street address are required."),
  body("deliveryAddress")
    .optional()
    .custom((value = {}) => {
      if (!value?.province || !value?.district) {
        return true;
      }

      return isValidProvinceDistrictPair(value.province, value.district);
    })
    .withMessage("Province and district combination is invalid."),
  body("deliveryAddress.province").optional().trim(),
  body("deliveryAddress.district").optional().trim(),
  body("deliveryAddress.neighborhood").optional().trim(),
  body("deliveryAddress.streetAddress").optional().trim(),
  body("deliveryAddress.addressTitle").optional({ values: "falsy" }).trim(),
  body("deliveryAddress.postalCode").optional({ values: "falsy" }).trim(),
  body("billingAddress.email")
    .optional({ values: "falsy" })
    .isEmail()
    .withMessage("Billing email must be valid.")
];

billingAddressFields.forEach((field) => {
  profileValidator.push(body(`billingAddress.${field}`).optional().trim());
});

profileValidator.push(
  body("billingAddress.phone")
    .optional({ values: "falsy" })
    .custom((value) => isValidProfilePhone(value))
    .withMessage("Billing phone number format is invalid.")
);

export const profilePasswordValidator = [
  body("currentPassword").trim().notEmpty().withMessage("Current password is required."),
  body("newPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters long.")
];
