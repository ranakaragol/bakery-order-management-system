import test from "node:test";
import assert from "node:assert/strict";
import {
  PASSWORD_MIN_LENGTH,
  PHONE_INPUT_PATTERN,
  getPasswordValidationMessage,
  getPhoneValidationMessage,
  isValidPasswordLength,
  isValidProfilePhone
} from "./accountValidation.js";

test("account validation keeps phone and password rules consistent", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8);
  assert.equal(isValidPasswordLength("1234567"), false);
  assert.equal(isValidPasswordLength("12345678"), true);
  assert.equal(isValidProfilePhone("12"), false);
  assert.equal(isValidProfilePhone("+90 532 123 45 67"), true);
  assert.equal(PHONE_INPUT_PATTERN, "[+]?[0-9\\s()\\-]{10,20}");
  assert.equal(getPasswordValidationMessage(), "Şifre en az 8 karakter olmalıdır.");
  assert.equal(getPhoneValidationMessage("Fatura telefonu"), "Fatura telefonu geçerli olmalıdır.");
});
