import test from "node:test";
import assert from "node:assert/strict";
import { formatOrderStatus, formatPaymentMethod, formatPaymentStatus } from "./formatters.js";

test("order and payment labels are localized for customer-facing screens", () => {
  assert.equal(formatOrderStatus("Hazirlaniyor"), "Hazırlanıyor");
  assert.equal(formatOrderStatus("Teslimata Cikti"), "Teslimata Çıktı");
  assert.equal(formatPaymentMethod("bank_transfer"), "Havale & EFT");
  assert.equal(formatPaymentStatus("unpaid"), "Ödeme Bekleniyor");
});
