import fs from "node:fs";
import path from "node:path";
import { productDefinitions } from "../shared/pasaliCatalogData.js";

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const productCardPath = path.join(projectRoot, "frontend/src/components/ProductCard.jsx");

const forbiddenNamePatterns = [/Sirozberg/u, /\bSirozbek\b/u, /\bIb[ıi]za\b/u, /Sut Burger/u];
const exactWeightRules = new Map([
  ["cilekli-sut-burger", "1200 gr"],
  ["lancop", "1000 gr"],
  ["meyveli-tartolet", "1500 gr"],
  ["snickers", "1500 gr"],
  ["mozaik-pasta", "2000 gr"]
]);

const errors = [];

for (const product of productDefinitions) {
  for (const pattern of forbiddenNamePatterns) {
    if (pattern.test(product.name) || pattern.test(product.description || "")) {
      errors.push(`Türkçe karakter normalize edilmedi: ${product.id} -> ${product.name}`);
      break;
    }
  }

  if (product.category === "Ekler" && product.weight !== "1200 gr") {
    errors.push(`Ekler gramajı hatalı: ${product.id} -> ${product.weight}`);
  }

  if (product.category === "Marki" && product.weight !== "1500 gr") {
    errors.push(`Marki gramajı hatalı: ${product.id} -> ${product.weight}`);
  }

  if (product.category === "Rulo" && product.weight !== "1500 gr") {
    errors.push(`Rulo gramajı hatalı: ${product.id} -> ${product.weight}`);
  }

  const exactWeight = exactWeightRules.get(product.id);

  if (exactWeight && product.weight !== exactWeight) {
    errors.push(`Ürün gramajı hatalı: ${product.id} -> ${product.weight}`);
  }
}

const productCardSource = fs.readFileSync(productCardPath, "utf8");

if (productCardSource.includes("product.weight")) {
  errors.push("Müşteri ürün kartında gramaj gösterimi kaldı.");
}

if (errors.length) {
  console.error("Katalog doğrulama hataları:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Katalog verisi ve gramaj gösterimi doğrulandı.");
