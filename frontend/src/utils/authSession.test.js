import test from "node:test";
import assert from "node:assert/strict";
import { restoreAuthenticatedUser } from "./authSession.js";

test("restoreAuthenticatedUser returns the current user when auth/me succeeds", async () => {
  const user = { id: "user-1", role: "customer" };
  const restoredUser = await restoreAuthenticatedUser({
    get: async (path) => {
      assert.equal(path, "/auth/me");

      return {
        data: {
          user
        }
      };
    }
  });

  assert.deepEqual(restoredUser, user);
});

test("restoreAuthenticatedUser returns null when auth/me fails", async () => {
  const restoredUser = await restoreAuthenticatedUser({
    get: async () => {
      throw new Error("Unauthorized");
    }
  });

  assert.equal(restoredUser, null);
});
