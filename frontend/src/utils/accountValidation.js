import {
  PASSWORD_MIN_LENGTH,
  PROFILE_PHONE_INPUT_PATTERN,
  isValidPasswordLength,
  isValidProfilePhone
} from "../../../shared/profile.js";

export const PHONE_INPUT_PATTERN = PROFILE_PHONE_INPUT_PATTERN;
export const PHONE_INPUT_TITLE =
  "Telefon numarası 10-20 karakter olmalı ve yalnızca rakam, boşluk, +, parantez veya tire içermelidir.";
export const PASSWORD_INPUT_TITLE = `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`;

export const getPhoneValidationMessage = (label = "Telefon numarası") => `${label} geçerli olmalıdır.`;
export const getPasswordValidationMessage = () => `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`;

export { PASSWORD_MIN_LENGTH, isValidPasswordLength, isValidProfilePhone };
