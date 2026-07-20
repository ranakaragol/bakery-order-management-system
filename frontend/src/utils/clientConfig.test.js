import test from "node:test";
import assert from "node:assert/strict";
import api, { resolveApiBaseUrl } from "../api/client.js";

test("resolveApiBaseUrl falls back to the current hostname for local cookie compatibility", () => {
  const baseUrl = resolveApiBaseUrl("", {
    protocol: "http:",
    hostname: "localhost"
  });

  assert.equal(baseUrl, "http://localhost:5001/api");
});

test("authenticated api client sends credentials with requests", () => {
  assert.equal(api.defaults.withCredentials, true);
});
