export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY"
  }).format(value);

export const formatDate = (value) =>
  new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));

export const stockLabels = {
  in_stock: "Stokta",
  limited: "Sinirli",
  out_of_stock: "Tukendi"
};
