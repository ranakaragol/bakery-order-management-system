import { normalizeCatalogProduct } from "./catalogProductRules.js";

const buildDisplayPrice = (price, unit, variants = []) => {
  if (variants.length) {
    const prices = variants
      .map((variant) => Number(variant.price))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);

    if (prices.length) {
      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];

      return firstPrice === lastPrice ? `${firstPrice} TL` : `${firstPrice} TL - ${lastPrice} TL`;
    }
  }

  if (price === null || price === undefined) {
    return "Fiyat sorunuz";
  }

  return `${price} TL${unit ? ` / ${unit}` : ""}`;
};

const createProduct = ({
  id,
  name,
  category,
  image,
  price = null,
  unit,
  weight,
  portion,
  storageCondition,
  shelfLife,
  description,
  catalogPage,
  variants = [],
  featured = false,
  stockStatus = "in_stock",
  stockQuantity = 12,
  displayPrice
}) =>
  normalizeCatalogProduct({
    id,
    name,
    category,
    image,
    price,
    displayPrice: displayPrice || buildDisplayPrice(price, unit, variants),
    unit,
    weight,
    portion,
    storageCondition,
    shelfLife,
    description,
    catalogPage,
    variants,
    featured,
    stockStatus,
    stockQuantity
  });

const createCakeVariants = () => [
  {
    id: "tek",
    name: "Tek Pasta",
    price: 125
  },
  {
    id: "0-no",
    name: "0 No Pasta",
    price: 420
  },
  {
    id: "1-no",
    name: "1 No Pasta",
    price: 550
  },
  {
    id: "2-no",
    name: "2 No Pasta",
    price: 650
  }
];

const standardStorage = "+4/+6 Buzdolabı";
const cakeShelfLife = "2-3 Gün";
const dessertShelfLife = "3-4 Gün";

export const pasaliBrand = {
  name: "Paşalı Patiserrie",
  tagline: "2025'ten beri hizmetinizde",
  motto: "Lezzette güven, kalitede istikrar",
  logo: "/assets/branding/pasali-patiserrie-logo.jpeg",
  priceList: "/assets/documents/pasali-fiyat-listesi.jpeg",
  catalogPdf: "/assets/documents/pasali-urun-katalogu.pdf",
  productManifest: "/assets/products/pasali-catalog/urun_manifest.normalized.json"
};

export const categoryDefinitions = [
  {
    id: "pastalar",
    name: "Pastalar",
    slug: "pastalar",
    description: "Standart numaralı ve özel lezzetli pasta seçenekleri.",
    imageUrl: "/assets/products/pasali-catalog/pastalar/babaroski-pasta.jpg",
    isFeatured: true
  },
  {
    id: "ekler",
    name: "Ekler",
    slug: "ekler",
    description: "Kilogram bazlı, farklı dolgularla hazırlanan günlük ekler çeşitleri.",
    imageUrl: "/assets/products/pasali-catalog/ekler/cikolatali-ekler.jpg",
    isFeatured: true
  },
  {
    id: "petifur",
    name: "Petifür",
    slug: "petifur",
    description: "Paylaşımlık petifür ve soğuk tatlı seçenekleri.",
    imageUrl: "/assets/products/pasali-catalog/petifur/snickers.jpg",
    isFeatured: true
  },
  {
    id: "marki",
    name: "Marki",
    slug: "marki",
    description: "Çilek, çikolata ve fıstık lezzetli marki ürünleri.",
    imageUrl: "/assets/products/pasali-catalog/marki/marki-cikolata.jpg",
    isFeatured: true
  },
  {
    id: "rulo",
    name: "Rulo",
    slug: "rulo",
    description: "Muz, çikolata ve İbiza çeşitleriyle paylaşımlık rulo ürünler.",
    imageUrl: "/assets/products/pasali-catalog/rulo/cikolata-rulo.jpg",
    isFeatured: true
  },
  {
    id: "cup-tatlilar",
    name: "Cup Tatlılar",
    slug: "cup-tatlilar",
    description: "Adet bazlı sunulan cup tatlılar ve kaşıklık lezzetler.",
    imageUrl: "/assets/products/pasali-catalog/cup-tatlilar/magnolia-cilek.jpg",
    isFeatured: true
  },
  {
    id: "cheesecake",
    name: "Cheesecake",
    slug: "cheesecake",
    description: "Dilim bazlı limon, portakal ve frambuaz cheesecake seçenekleri.",
    imageUrl: "/assets/products/pasali-catalog/cheesecake/cheesecake-limon.jpg",
    isFeatured: true
  },
  {
    id: "tepsi-tatlilari",
    name: "Tepsi Tatlıları",
    slug: "tepsi-tatlilari",
    description: "Tepsi veya kilogram bazlı, paylaşımlık servis için hazırlanan tatlılar.",
    imageUrl: "/assets/products/pasali-catalog/tepsi-tatlilari/mozaik-pasta.jpg",
    isFeatured: true
  }
];

export const productDefinitions = [
  createProduct({
    id: "babaroski-pasta",
    name: "Babaroski Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/babaroski-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Katalogda yer alan özel lezzetli bütün pasta çeşidi.",
    catalogPage: 14,
    variants: createCakeVariants(),
    featured: true,
    stockQuantity: 6
  }),
  createProduct({
    id: "mois-pasta",
    name: "Mois Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/mois-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Katalogda yer alan özel lezzetli bütün pasta çeşidi.",
    catalogPage: 14,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "lotus-pasta",
    name: "Lotus Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/lotus-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Lotus aromalı özel bütün pasta çeşidi.",
    catalogPage: 14,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "oreo-pasta",
    name: "Oreo Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/oreo-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Oreo lezzetli özel bütün pasta çeşidi.",
    catalogPage: 15,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "cikolata-pasta",
    name: "Çikolata Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/cikolata-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Çikolata lezzetli özel bütün pasta çeşidi.",
    catalogPage: 15,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "cilek-beyaz-pasta",
    name: "Çilek Beyaz Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/cilek-beyaz-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Beyaz çikolata ve çilek dengeli özel bütün pasta çeşidi.",
    catalogPage: 15,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "muzlu-pasta",
    name: "Muzlu Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/muzlu-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Muzlu özel bütün pasta çeşidi.",
    catalogPage: 16,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "cilek-cikolata-pasta",
    name: "Çilek Çikolata Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/cilek-cikolata-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Çilek ve çikolata dengeli özel bütün pasta çeşidi.",
    catalogPage: 16,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "fistikli-pasta",
    name: "Fıstıklı Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/fistikli-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Fıstıklı özel bütün pasta çeşidi.",
    catalogPage: 16,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "krokanli-pasta",
    name: "Krokanlı Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/krokanli-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Krokanlı özel bütün pasta çeşidi.",
    catalogPage: 17,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "profiterol-pasta",
    name: "Profiterol Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/profiterol-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Profiterol dokulu özel bütün pasta çeşidi.",
    catalogPage: 17,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "hasbahce-pasta",
    name: "Hasbahçe Pasta",
    category: "Pastalar",
    image: "/assets/products/pasali-catalog/pastalar/hasbahce-pasta.jpg",
    unit: "Adet",
    weight: "Standart pasta",
    portion: "8-10 kişilik",
    storageCondition: standardStorage,
    shelfLife: cakeShelfLife,
    description: "Hasbahçe özel bütün pasta çeşidi.",
    catalogPage: 17,
    variants: createCakeVariants(),
    stockQuantity: 6
  }),
  createProduct({
    id: "cikolatali-ekler",
    name: "Çikolatalı Ekler",
    category: "Ekler",
    image: "/assets/products/pasali-catalog/ekler/cikolatali-ekler.jpg",
    price: 380,
    unit: "Kg",
    weight: "1200 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çikolatalı günlük ekler çeşidi.",
    catalogPage: 3,
    featured: true,
    stockQuantity: 12
  }),
  createProduct({
    id: "lotuslu-ekler",
    name: "Lotuslu Ekler",
    category: "Ekler",
    image: "/assets/products/pasali-catalog/ekler/lotuslu-ekler.jpg",
    price: 380,
    unit: "Kg",
    weight: "1200 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Lotuslu günlük ekler çeşidi.",
    catalogPage: 3,
    stockQuantity: 12
  }),
  createProduct({
    id: "cilekli-ekler",
    name: "Çilekli Ekler",
    category: "Ekler",
    image: "/assets/products/pasali-catalog/ekler/cilekli-ekler.jpg",
    price: 380,
    unit: "Kg",
    weight: "1200 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çilekli günlük ekler çeşidi.",
    catalogPage: 3,
    stockQuantity: 12
  }),
  createProduct({
    id: "fistikli-ekler",
    name: "Fıstıklı Ekler",
    category: "Ekler",
    image: "/assets/products/pasali-catalog/ekler/fistikli-ekler.jpg",
    price: 380,
    unit: "Kg",
    weight: "1200 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Fıstıklı günlük ekler çeşidi.",
    catalogPage: 4,
    stockQuantity: 12
  }),
  createProduct({
    id: "meyveli-ekler",
    name: "Meyveli Ekler",
    category: "Ekler",
    image: "/assets/products/pasali-catalog/ekler/meyveli-ekler.jpg",
    price: 380,
    unit: "Kg",
    weight: "1200 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Meyveli günlük ekler çeşidi.",
    catalogPage: 4,
    stockQuantity: 12
  }),
  createProduct({
    id: "meyveli-tartolet",
    name: "Meyveli Tartolet",
    category: "Petifür",
    image: "/assets/products/pasali-catalog/petifur/meyveli-tartolet.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Meyveli tartolet petifür çeşidi.",
    catalogPage: 4,
    stockQuantity: 6
  }),
  createProduct({
    id: "snickers",
    name: "Snickers",
    category: "Petifür",
    image: "/assets/products/pasali-catalog/petifur/snickers.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Snickers petifür çeşidi.",
    catalogPage: 8,
    stockQuantity: 6
  }),
  createProduct({
    id: "lancop",
    name: "Lancop",
    category: "Petifür",
    image: "/assets/products/pasali-catalog/petifur/lancop.jpg",
    unit: "Tepsi",
    weight: "1000 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Lancop petifür çeşidi.",
    catalogPage: 8,
    stockQuantity: 6
  }),
  createProduct({
    id: "sirozbek",
    name: "Şirozbek",
    category: "Petifür",
    image: "/assets/products/pasali-catalog/petifur/sirozbek.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Şirozbek petifür çeşidi.",
    catalogPage: 11,
    stockQuantity: 6
  }),
  createProduct({
    id: "cilekli-sut-burger",
    name: "Çilekli Süt Burger",
    category: "Petifür",
    image: "/assets/products/pasali-catalog/petifur/cilekli-sut-burger.jpg",
    unit: "Tepsi",
    weight: "1200 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çilekli süt burger petifür çeşidi.",
    catalogPage: 11,
    stockQuantity: 6
  }),
  createProduct({
    id: "marki-cilek",
    name: "Marki Çilek",
    category: "Marki",
    image: "/assets/products/pasali-catalog/marki/marki-cilek.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çilek lezzetli marki çeşidi.",
    catalogPage: 5,
    stockQuantity: 6
  }),
  createProduct({
    id: "marki-cikolata",
    name: "Marki Çikolata",
    category: "Marki",
    image: "/assets/products/pasali-catalog/marki/marki-cikolata.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çikolata lezzetli marki çeşidi.",
    catalogPage: 5,
    stockQuantity: 6
  }),
  createProduct({
    id: "marki-fistik",
    name: "Marki Fıstık",
    category: "Marki",
    image: "/assets/products/pasali-catalog/marki/marki-fistik.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Fıstık lezzetli marki çeşidi.",
    catalogPage: 5,
    stockQuantity: 6
  }),
  createProduct({
    id: "muz-cilek-rulo",
    name: "Muz Çilek Rulo",
    category: "Rulo",
    image: "/assets/products/pasali-catalog/rulo/muz-cilek-rulo.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Muz ve çilek lezzetli rulo çeşidi.",
    catalogPage: 6,
    stockQuantity: 6
  }),
  createProduct({
    id: "cikolata-rulo",
    name: "Çikolata Rulo",
    category: "Rulo",
    image: "/assets/products/pasali-catalog/rulo/cikolata-rulo.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çikolata lezzetli rulo çeşidi.",
    catalogPage: 6,
    stockQuantity: 6
  }),
  createProduct({
    id: "ibiza-rulo",
    name: "İbiza Rulo",
    category: "Rulo",
    image: "/assets/products/pasali-catalog/rulo/ibiza-rulo.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "İbiza lezzetli rulo çeşidi.",
    catalogPage: 6,
    stockQuantity: 6
  }),
  createProduct({
    id: "ibiza-rulo-cikolatali",
    name: "İbiza Rulo Çikolata Parçacıklı",
    category: "Rulo",
    image: "/assets/products/pasali-catalog/rulo/ibiza-rulo-cikolata-parcacikli.jpg",
    unit: "Tepsi",
    weight: "1500 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çikolata parçacıklı İbiza rulo çeşidi.",
    catalogPage: 7,
    stockQuantity: 6
  }),
  createProduct({
    id: "profiterol-cup",
    name: "Profiterol Cup",
    category: "Cup Tatlılar",
    image: "/assets/products/pasali-catalog/cup-tatlilar/profiterol.jpg",
    price: 115,
    unit: "Adet",
    weight: "150 gr",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Profiterol cup tatlısı.",
    catalogPage: 8,
    featured: true,
    stockQuantity: 20
  }),
  createProduct({
    id: "magnolia-muz",
    name: "Magnolia Muz",
    category: "Cup Tatlılar",
    image: "/assets/products/pasali-catalog/cup-tatlilar/magnolia-muz.jpg",
    price: 115,
    unit: "Adet",
    weight: "150 gr",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Muzlu magnolia cup tatlısı.",
    catalogPage: 9,
    featured: true,
    stockQuantity: 20
  }),
  createProduct({
    id: "magnolia-cilek",
    name: "Magnolia Çilek",
    category: "Cup Tatlılar",
    image: "/assets/products/pasali-catalog/cup-tatlilar/magnolia-cilek.jpg",
    price: 115,
    unit: "Adet",
    weight: "150 gr",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çilekli magnolia cup tatlısı.",
    catalogPage: 9,
    featured: true,
    stockQuantity: 20
  }),
  createProduct({
    id: "magnolia-oreo",
    name: "Magnolia Oreo",
    category: "Cup Tatlılar",
    image: "/assets/products/pasali-catalog/cup-tatlilar/magnolia-oreo.jpg",
    price: 115,
    unit: "Adet",
    weight: "150 gr",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Oreo magnolia cup tatlısı.",
    catalogPage: 9,
    stockQuantity: 20
  }),
  createProduct({
    id: "sutlac-cup",
    name: "Sütlaç Cup",
    category: "Cup Tatlılar",
    image: "/assets/documents/pasali-fiyat-listesi.jpeg",
    price: 115,
    unit: "Adet",
    weight: "150 gr",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Fiyat listesinde yer alan sütlaç cup ürünü.",
    catalogPage: 1,
    stockQuantity: 20
  }),
  createProduct({
    id: "cheesecake-limon",
    name: "Cheesecake Limon",
    category: "Cheesecake",
    image: "/assets/products/pasali-catalog/cheesecake/cheesecake-limon.jpg",
    price: 125,
    unit: "Adet",
    weight: "1 dilim",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Limonlu cheesecake dilimi.",
    catalogPage: 10,
    featured: true,
    stockQuantity: 16
  }),
  createProduct({
    id: "cheesecake-portakal",
    name: "Cheesecake Portakal",
    category: "Cheesecake",
    image: "/assets/products/pasali-catalog/cheesecake/cheesecake-portakal.jpg",
    price: 125,
    unit: "Adet",
    weight: "1 dilim",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Portakallı cheesecake dilimi.",
    catalogPage: 10,
    stockQuantity: 16
  }),
  createProduct({
    id: "cheesecake-frambuaz",
    name: "Cheesecake Frambuaz",
    category: "Cheesecake",
    image: "/assets/products/pasali-catalog/cheesecake/cheesecake-frambuaz.jpg",
    price: 125,
    unit: "Adet",
    weight: "1 dilim",
    portion: "1 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Frambuazlı cheesecake dilimi.",
    catalogPage: 10,
    stockQuantity: 16
  }),
  createProduct({
    id: "mozaik-pasta",
    name: "Mozaik Pasta",
    category: "Petifür",
    image: "/assets/products/pasali-catalog/tepsi-tatlilari/mozaik-pasta.jpg",
    price: 440,
    unit: "Kg",
    weight: "2000 gr",
    portion: "Paylaşımlık servis",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Mozaik pasta tepsi/kilogram ürünü.",
    catalogPage: 11,
    featured: true,
    stockQuantity: 8
  }),
  createProduct({
    id: "karamel-trilece",
    name: "Karamel Trileçe",
    category: "Tepsi Tatlıları",
    image: "/assets/products/pasali-catalog/tepsi-tatlilari/karamel-trilece.jpg",
    price: 725,
    unit: "Tepsi",
    weight: "Standart tepsi",
    portion: "12-15 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Karamelli trileçe tepsi tatlısı.",
    catalogPage: 12,
    featured: true,
    stockQuantity: 6
  }),
  createProduct({
    id: "frambuaz-trilece",
    name: "Frambuaz Trileçe",
    category: "Tepsi Tatlıları",
    image: "/assets/products/pasali-catalog/tepsi-tatlilari/frambuaz-trilece.jpg",
    price: 725,
    unit: "Tepsi",
    weight: "Standart tepsi",
    portion: "12-15 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Frambuazlı trileçe tepsi tatlısı.",
    catalogPage: 12,
    stockQuantity: 6
  }),
  createProduct({
    id: "tiramisu",
    name: "Tiramisu",
    category: "Tepsi Tatlıları",
    image: "/assets/products/pasali-catalog/tepsi-tatlilari/tiramisu.jpg",
    price: 725,
    unit: "Tepsi",
    weight: "Standart tepsi",
    portion: "12-15 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Tiramisu tepsi tatlısı.",
    catalogPage: 12,
    stockQuantity: 6
  }),
  createProduct({
    id: "cikolatali-islak-kek",
    name: "Çikolatalı Islak Kek",
    category: "Tepsi Tatlıları",
    image: "/assets/products/pasali-catalog/tepsi-tatlilari/cikolatali-islak-kek.jpg",
    price: 725,
    unit: "Tepsi",
    weight: "Standart tepsi",
    portion: "12-15 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Çikolatalı ıslak kek tepsi tatlısı.",
    catalogPage: 13,
    stockQuantity: 6
  }),
  createProduct({
    id: "lotus-kasik",
    name: "Lotus Kaşık",
    category: "Tepsi Tatlıları",
    image: "/assets/products/pasali-catalog/tepsi-tatlilari/lotus-kasik.jpg",
    price: 725,
    unit: "Tepsi",
    weight: "Standart tepsi",
    portion: "12-15 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Lotus kaşık tepsi tatlısı.",
    catalogPage: 13,
    stockQuantity: 6
  }),
  createProduct({
    id: "soguk-baklava",
    name: "Soğuk Baklava",
    category: "Tepsi Tatlıları",
    image: "/assets/products/pasali-catalog/tepsi-tatlilari/soguk-baklava.jpg",
    price: 725,
    unit: "Tepsi",
    weight: "Standart tepsi",
    portion: "12-15 kişilik",
    storageCondition: standardStorage,
    shelfLife: dessertShelfLife,
    description: "Soğuk baklava tepsi tatlısı.",
    catalogPage: 13,
    stockQuantity: 6
  })
];

export const pasaliContactInfo = {
  heroTitle: "Lezzetin ve ustalığın buluştuğu özel tatlar.",
  heroDescription: "Özenle hazırlanan tatlar, güvenle sunulan lezzetler.",
  phone: "+90 542 315 85 35",
  email: "toptanpastacin@gmail.com",
  address: "Sipariş ve katalog teyidi için iletişime geçin.",
  workingHours: "Gece üretim, sabah dağıtım",
  aboutContent: {
    titleTr: "TOPTAN LEZZETİN GÜVENİLİR MARKASI",
    bodyTr:
      "2025 yılından bu yana Paşalı Patiserrie, toptan pasta ve petifür üretiminde kalite, estetik ve lezzeti aynı potada buluşturarak sektöründe fark yaratan bir marka olma yolunda ilerlemektedir. Her ürünümüzde yalnızca bir tatlı değil; ustalığı, titizliği ve mükemmelliğe olan bağlılığımızı sunuyoruz.\n\nEn kaliteli malzemelerle, özenle hazırladığımız pasta ve petifürlerimizi güçlü üretim ve dağıtım altyapımızla işletmelere daima taze, güvenilir ve eksiksiz şekilde ulaştırıyoruz. Çünkü biliyoruz ki, gerçek başarı yalnızca ürün üretmekle değil, güven inşa etmekle mümkündür.\n\nBugün Paşalı Patiserrie, sadece toptan pasta ve petifür tedarik eden bir firma değildir. Biz; işletmelerin vitrininin lezzetini yükselten, müşterilerine değer katan ve her iş birliğini uzun soluklu bir ortaklık olarak gören güçlü bir çözüm ortağıyız.\n\nPaşalı Patiserrie… Her lokmada ustalık, her teslimatta güven, her iş ortaklığında kalıcı değer.",
    titleEn: "THE TRUSTED BRAND IN WHOLESALE DELICACIES",
    bodyEn:
      "Since 2025, Paşalı Patiserrie has been bringing together quality, elegance, and exceptional taste in wholesale cake and petit four production, steadily establishing itself as a distinctive name in the industry.\n\nIn every product we create, we offer not just a dessert, but a reflection of our craftsmanship, meticulous attention to detail, and commitment to excellence.\n\nUsing the finest ingredients, we carefully prepare our cakes and petit fours and deliver them to businesses fresh, reliable, and complete through our strong production and distribution network. Because we believe that true success is built not only by producing exceptional products but also by earning trust.\n\nToday, Paşalı Patiserrie is more than a wholesale supplier of cakes and petit fours. We are a trusted business partner that enhances the value of our clients’ showcases, contributes to their success, and views every collaboration as a long-term partnership.\n\nPaşalı Patiserrie… Craftsmanship in every bite, trust in every delivery, and lasting value in every partnership."
  },
  paymentDetails: {
    accountHolder: "Serpil Günay",
    iban: "TR30 0015 7000 0000 0204 0607 09",
    bankName: "Enpara Bank A.Ş."
  },
  socialLinks: {
    instagram: "https://www.instagram.com/toptanpastacin?utm_source=qr",
    facebook: "facebook.com/pasalipatiserrie",
    whatsapp: "https://wa.me/905423158535"
  }
};
