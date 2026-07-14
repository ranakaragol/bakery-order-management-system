import { describe, expect, it } from "vitest";
import {
  findCatalogCategoryDefinition,
  findCatalogProductDefinition
} from "../utils/catalogResolver.js";

describe("catalogResolver", () => {
  it("finds shared catalog products by fallback id", () => {
    const product = findCatalogProductDefinition("mois-pasta");

    expect(product?.name).toBe("Mois Pasta");
  });

  it("finds shared catalog categories by slug or name", () => {
    expect(findCatalogCategoryDefinition("cup-tatlilar")?.name).toBe("Cup Tatlılar");
    expect(findCatalogCategoryDefinition("Cup Tatlılar")?.slug).toBe("cup-tatlilar");
  });
});
