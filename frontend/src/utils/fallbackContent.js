export const fallbackCategories = [
  {
    _id: "category-ekler",
    name: "Ekler",
    slug: "ekler",
    description: "Cikolata, meyve ve premium krema dolgulariyla hazirlanan gunluk ekler secenekleri.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    _id: "category-magnolya",
    name: "Magnolya Cesitleri",
    slug: "magnolya-cesitleri",
    description: "Meyveli, biskuvi katmanli ve hafif icimli magnolya bardaklari.",
    imageUrl:
      "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    _id: "category-single-cakes",
    name: "Tek Kisilik Pastalar",
    slug: "tek-kisilik-pastalar",
    description: "Mono porsiyon sunumlu, vitrine uygun ve anlik tuketime hazir butik pastalar.",
    imageUrl:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true
  },
  {
    _id: "category-bite-desserts",
    name: "Tadimlik Lokmalik Tatlilar",
    slug: "tadimlik-lokmalik-tatlilar",
    description: "Mini kup, lokmalik tatli ve paylasimlik ufak porsiyon tatli secenekleri.",
    imageUrl:
      "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false
  }
];

export const fallbackProducts = [
  {
    _id: "product-ekler-cikolata",
    name: "Cikolatali Ekler",
    description: "Parlak cikolata kaplamali, yumusak kremali ve gunluk hazirlanan klasik ekler.",
    price: 110,
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=1200&q=80",
    category: {
      _id: "category-ekler",
      name: "Ekler",
      slug: "ekler"
    },
    stockStatus: "in_stock",
    featured: true
  },
  {
    _id: "product-ekler-frambuaz",
    name: "Frambuazli Ekler",
    description: "Hafif frambuaz aromasi ve yumusak krema dengesiyle vitrin favorisi.",
    price: 125,
    imageUrl:
      "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80",
    category: {
      _id: "category-ekler",
      name: "Ekler",
      slug: "ekler"
    },
    stockStatus: "limited",
    featured: true
  },
  {
    _id: "product-magnolya-cilek",
    name: "Cilekli Magnolya",
    description: "Biskuvi katmanlari ve cilek dengesiyle servis edilen hafif magnolya kupu.",
    price: 185,
    imageUrl:
      "https://images.unsplash.com/photo-1488477304112-4944851de03d?auto=format&fit=crop&w=1200&q=80",
    category: {
      _id: "category-magnolya",
      name: "Magnolya Cesitleri",
      slug: "magnolya-cesitleri"
    },
    stockStatus: "in_stock",
    featured: true
  },
  {
    _id: "product-magnolya-oreo",
    name: "Oreo Magnolya",
    description: "Kakaolu biskuvi ve krema katmanlariyla yogun ama dengeli bir bardak tatli.",
    price: 195,
    imageUrl:
      "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=80",
    category: {
      _id: "category-magnolya",
      name: "Magnolya Cesitleri",
      slug: "magnolya-cesitleri"
    },
    stockStatus: "in_stock",
    featured: true
  },
  {
    _id: "product-mini-cake",
    name: "Frambuazli Tek Kisilik Pasta",
    description: "Mono porsiyon, yumusak dokulu ve meyve dengeli butik pasta sunumu.",
    price: 245,
    imageUrl:
      "https://images.unsplash.com/photo-1559622214-8f4c0d6f2d4f?auto=format&fit=crop&w=1200&q=80",
    category: {
      _id: "category-single-cakes",
      name: "Tek Kisilik Pastalar",
      slug: "tek-kisilik-pastalar"
    },
    stockStatus: "in_stock",
    featured: false
  },
  {
    _id: "product-lokmalik",
    name: "Mini Tadimlik Tatli Kutusu",
    description: "Sunum tabaklari ve davet masalari icin hazirlanan lokmalik mini tatli secimi.",
    price: 390,
    imageUrl:
      "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=1200&q=80",
    category: {
      _id: "category-bite-desserts",
      name: "Tadimlik Lokmalik Tatlilar",
      slug: "tadimlik-lokmalik-tatlilar"
    },
    stockStatus: "limited",
    featured: false
  }
];

export const fallbackContactInfo = {
  heroTitle: "Kutlamalari lezzetli bir sahneye donusturen butik pastacilik",
  heroDescription:
    "Ozgün tasarimlar, premium malzemeler ve teslimata hazir operasyon yapisi ile kutlamalariniza eslik ediyoruz.",
  phone: "+90 555 000 11 22",
  email: "hello@firinatelier.com",
  address: "Tesvikiye Mah. Valikonagi Cad. No: 18 Sisli / Istanbul",
  workingHours: "Her gun 09:00 - 20:00",
  socialLinks: {
    instagram: "instagram.com/firinatelier",
    facebook: "facebook.com/firinatelier",
    whatsapp: "wa.me/905550001122"
  }
};
