const normalizeCatalogText = (value = "") =>
  String(value)
    .replace(/Sirozberg/gi, "Şirozbek")
    .replace(/Sirozbek/gi, "Şirozbek")
    .replace(/Ib[ıi]za/gi, "İbiza")
    .replace(/Sut Burger/gi, "Süt Burger")
    .trim();

const resolveProductWeight = ({ categoryName = "", name = "", weight = "" }) => {
  const normalizedCategory = String(categoryName).toLocaleLowerCase("tr-TR");
  const normalizedName = String(name).toLocaleLowerCase("tr-TR");

  if (normalizedCategory === "ekler") {
    return "1200 gr";
  }

  if (normalizedCategory === "marki" || normalizedCategory === "rulo") {
    return "1500 gr";
  }

  if (normalizedName.includes("süt burger")) {
    return "1200 gr";
  }

  if (normalizedName.includes("lancop")) {
    return "1000 gr";
  }

  if (normalizedName.includes("mozaik")) {
    return "2000 gr";
  }

  if (
    normalizedName.includes("şirozbek") ||
    normalizedName.includes("snickers") ||
    normalizedName.includes("tartolet") ||
    normalizedName.includes("i̇biza")
  ) {
    return "1500 gr";
  }

  return String(weight || "").trim();
};

export const normalizeCatalogProduct = (product = {}, options = {}) => {
  const categoryName = options.categoryName || product.categoryName || product.category?.name || product.category || "";
  const normalizedName = normalizeCatalogText(product.name || "");
  const normalizedDescription = normalizeCatalogText(product.description || "");

  return {
    ...product,
    name: normalizedName,
    description: normalizedDescription,
    weight: resolveProductWeight({
      categoryName,
      name: normalizedName,
      weight: product.weight
    })
  };
};

