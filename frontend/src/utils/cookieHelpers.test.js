import test from "node:test";
import assert from "node:assert/strict";
import { readCookieValue } from "./cookieHelpers.js";

test("readCookieValue resolves the matching cookie without exposing other values", () => {
  const cookieSource = "pasali_csrf=csrf-token; theme=light";

  assert.equal(readCookieValue("pasali_csrf", cookieSource), "csrf-token");
  assert.equal(readCookieValue("missing", cookieSource), "");
});
