import test from "node:test";
import assert from "node:assert/strict";
import {
  getApiErrorMessage,
  getApiFieldErrors,
  getApiValidationMessages
} from "./apiErrors.js";

test("api error helpers separate field errors from generic messages", () => {
  const error = {
    response: {
      data: {
        message: "Validation failed.",
        errors: [
          {
            field: "email",
            message: "E-posta zorunludur."
          },
          {
            field: "password",
            message: "Şifre zorunludur."
          }
        ]
      }
    }
  };

  assert.deepEqual(getApiValidationMessages(error), ["E-posta zorunludur.", "Şifre zorunludur."]);
  assert.deepEqual(getApiFieldErrors(error), {
    email: "E-posta zorunludur.",
    password: "Şifre zorunludur."
  });
  assert.equal(getApiErrorMessage(error, "Fallback"), "Validation failed.");
});

test("api error helpers keep duplicate field responses mappable", () => {
  const error = {
    response: {
      data: {
        message: "Bu e-posta adresi zaten kullanımda.",
        field: "email"
      }
    }
  };

  assert.deepEqual(getApiFieldErrors(error), {
    email: "Bu e-posta adresi zaten kullanımda."
  });
});
