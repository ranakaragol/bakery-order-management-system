import { describe, expect, it } from "vitest";
import { createCorsOptions, getAllowedOrigins } from "../config/corsOptions.js";

describe("cors options", () => {
  it("supports credentials and keeps local frontend origins allowlisted", () => {
    const corsOptions = createCorsOptions();
    const allowedOrigins = getAllowedOrigins();

    expect(corsOptions.credentials).toBe(true);
    expect(allowedOrigins).toContain("http://localhost:5173");
    expect(allowedOrigins).toContain("http://127.0.0.1:5173");
  });

  it("rejects disallowed origins when credentials are used", async () => {
    const corsOptions = createCorsOptions();

    await expect(
      new Promise((resolve, reject) => {
        corsOptions.origin("https://evil.example.com", (error, value) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(value);
        });
      })
    ).rejects.toThrow("CORS is not allowed for this origin.");
  });
});
