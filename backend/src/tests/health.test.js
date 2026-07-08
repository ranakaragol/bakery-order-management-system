import { describe, expect, it, vi } from "vitest";
import { getHealth } from "../controllers/healthController.js";

describe("GET /api/health", () => {
  it("returns backend health status", async () => {
    const json = vi.fn();
    const response = { json };

    getHealth({}, response);

    expect(json).toHaveBeenCalledWith({
      status: "ok",
      service: "bakery-backend"
    });
  });
});
