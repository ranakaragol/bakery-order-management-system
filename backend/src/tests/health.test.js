import { describe, expect, it, vi } from "vitest";
import { getHealth } from "../controllers/healthController.js";
import backendPackage from "../../package.json" with { type: "json" };

describe("GET /api/health", () => {
  it("returns backend health status", async () => {
    const json = vi.fn();
    const response = { json };

    getHealth({}, response);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ok",
        service: "bakery-backend",
        version: backendPackage.version,
        runtime: expect.objectContaining({
          node: process.version
        })
      })
    );
  });
});
