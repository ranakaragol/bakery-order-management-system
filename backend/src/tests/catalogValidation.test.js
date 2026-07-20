import { validationResult } from "express-validator";
import { describe, expect, it, vi } from "vitest";
import { validateRequest } from "../middleware/validateRequest.js";
import { categoryValidator } from "../validators/catalogValidators.js";

const runValidators = async (validators, body) => {
  const req = { body: { ...body } };

  for (const validator of validators) {
    await validator.run(req);
  }

  return req;
};

const createResponse = () => {
  const response = {
    statusCode: 200,
    payload: undefined,
    status: vi.fn((code) => {
      response.statusCode = code;
      return response;
    }),
    json: vi.fn((payload) => {
      response.payload = payload;
      return response;
    })
  };

  return response;
};

describe("category validation", () => {
  it("returns a 400 response for invalid category payloads", async () => {
    const request = await runValidators(categoryValidator, {
      name: "",
      description: "",
      imageUrl: "",
      sortOrder: -1
    });
    const response = createResponse();
    const next = vi.fn();

    expect(validationResult(request).isEmpty()).toBe(false);

    validateRequest(request, response, next);

    expect(response.statusCode).toBe(400);
    expect(response.payload).toEqual({
      success: false,
      message: "Validation failed.",
      errors: expect.arrayContaining([
        expect.objectContaining({
          field: "name",
          message: "Kategori adı zorunludur."
        }),
        expect.objectContaining({
          field: "sortOrder",
          message: "Kategori sıralaması sıfır veya daha büyük bir sayı olmalıdır."
        })
      ])
    });
    expect(next).not.toHaveBeenCalled();
  });
});
