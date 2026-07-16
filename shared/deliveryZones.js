import { fromCurrencyMinorUnits, toCurrencyMinorUnits } from "./commerce.js";

export const DELIVERY_REGION_KEYS = {
  ISTANBUL_ANATOLIAN: "istanbul_anatolian",
  ISTANBUL_EUROPEAN: "istanbul_european",
  KOCAELI: "kocaeli"
};

export const DELIVERY_REGION_LABELS = {
  [DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN]: "İstanbul Anadolu Yakası",
  [DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN]: "İstanbul Avrupa Yakası",
  [DELIVERY_REGION_KEYS.KOCAELI]: "Kocaeli"
};

export const EUROPEAN_SIDE_MINIMUM_ORDER_CENTS = 200000;
export const MINIMUM_ORDER_REQUIRED_REGION_KEYS = [
  DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN,
  DELIVERY_REGION_KEYS.KOCAELI
];
export const MINIMUM_ORDER_WARNING_MESSAGE =
  "Bu teslimat bölgesinde minimum sipariş tutarı 2.000 TL'dir.";

const normalizeLocationToken = (value = "") =>
  String(value || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const createDistrict = (value, label, regionKey) => ({
  value,
  label,
  regionKey,
  normalizedValue: normalizeLocationToken(value),
  normalizedLabel: normalizeLocationToken(label)
});

const createProvince = (value, label, districts) => ({
  value,
  label,
  normalizedValue: normalizeLocationToken(value),
  normalizedLabel: normalizeLocationToken(label),
  districts: districts.map((district) => createDistrict(district.value, district.label, district.regionKey))
});

export const deliveryZoneConfig = [
  createProvince("istanbul", "İstanbul", [
    { value: "adalar", label: "Adalar", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "arnavutkoy", label: "Arnavutköy", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "atasehir", label: "Ataşehir", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "avcilar", label: "Avcılar", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "bagcilar", label: "Bağcılar", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "bahcelievler", label: "Bahçelievler", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "bakirkoy", label: "Bakırköy", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "basaksehir", label: "Başakşehir", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "bayrampasa", label: "Bayrampaşa", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "besiktas", label: "Beşiktaş", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "beykoz", label: "Beykoz", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "beylikduzu", label: "Beylikdüzü", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "beyoglu", label: "Beyoğlu", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "buyukcekmece", label: "Büyükçekmece", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "catalca", label: "Çatalca", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "cekmekoy", label: "Çekmeköy", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "esenler", label: "Esenler", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "esenyurt", label: "Esenyurt", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "eyupsultan", label: "Eyüpsultan", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "fatih", label: "Fatih", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "gaziosmanpasa", label: "Gaziosmanpaşa", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "gungoren", label: "Güngören", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "kadikoy", label: "Kadıköy", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "kagithane", label: "Kağıthane", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "kartal", label: "Kartal", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "kucukcekmece", label: "Küçükçekmece", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "maltepe", label: "Maltepe", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "pendik", label: "Pendik", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "sancaktepe", label: "Sancaktepe", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "sariyer", label: "Sarıyer", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "silivri", label: "Silivri", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "sultanbeyli", label: "Sultanbeyli", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "sultangazi", label: "Sultangazi", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "sile", label: "Şile", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "sisli", label: "Şişli", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN },
    { value: "tuzla", label: "Tuzla", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "umraniye", label: "Ümraniye", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "uskudar", label: "Üsküdar", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN },
    { value: "zeytinburnu", label: "Zeytinburnu", regionKey: DELIVERY_REGION_KEYS.ISTANBUL_EUROPEAN }
  ]),
  createProvince("kocaeli", "Kocaeli", [
    { value: "basiskele", label: "Başiskele", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "cayirova", label: "Çayırova", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "darica", label: "Darıca", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "derince", label: "Derince", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "dilovasi", label: "Dilovası", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "gebze", label: "Gebze", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "golcuk", label: "Gölcük", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "izmit", label: "İzmit", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "kandira", label: "Kandıra", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "karamursel", label: "Karamürsel", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "kartepe", label: "Kartepe", regionKey: DELIVERY_REGION_KEYS.KOCAELI },
    { value: "korfez", label: "Körfez", regionKey: DELIVERY_REGION_KEYS.KOCAELI }
  ])
];

const provinceMap = new Map(deliveryZoneConfig.map((province) => [province.value, province]));
const districtMap = new Map(
  deliveryZoneConfig.flatMap((province) =>
    province.districts.map((district) => [`${province.value}:${district.value}`, district])
  )
);

const normalizedProvinceLookup = new Map();
const normalizedDistrictLookup = new Map();

deliveryZoneConfig.forEach((province) => {
  [province.value, province.label, province.normalizedValue, province.normalizedLabel].forEach((token) => {
    if (token) {
      normalizedProvinceLookup.set(normalizeLocationToken(token), province.value);
    }
  });

  province.districts.forEach((district) => {
    [district.value, district.label, district.normalizedValue, district.normalizedLabel].forEach((token) => {
      if (token) {
        normalizedDistrictLookup.set(
          `${province.value}:${normalizeLocationToken(token)}`,
          district.value
        );
      }
    });
  });
});

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findTokenInText = (text = "", candidates = []) => {
  const normalizedText = normalizeLocationToken(text);

  if (!normalizedText) {
    return null;
  }

  return candidates.find((candidate) =>
    new RegExp(`(?:^|\\s)${escapeRegex(candidate)}(?:\\s|$)`).test(normalizedText)
  ) || null;
};

export const getProvinceOptions = () =>
  deliveryZoneConfig.map(({ value, label }) => ({
    value,
    label
  }));

export const getDistrictOptions = (province = "") =>
  (provinceMap.get(normalizeProvinceValue(province))?.districts || []).map(({ value, label, regionKey }) => ({
    value,
    label,
    regionKey
  }));

export const normalizeProvinceValue = (value = "") =>
  normalizedProvinceLookup.get(normalizeLocationToken(value)) || "";

export const normalizeDistrictValue = (province = "", value = "") => {
  const normalizedProvince = normalizeProvinceValue(province);

  if (!normalizedProvince) {
    return "";
  }

  return normalizedDistrictLookup.get(`${normalizedProvince}:${normalizeLocationToken(value)}`) || "";
};

export const getProvinceRecord = (province = "") => provinceMap.get(normalizeProvinceValue(province)) || null;

export const getDistrictRecord = (province = "", district = "") =>
  districtMap.get(`${normalizeProvinceValue(province)}:${normalizeDistrictValue(province, district)}`) || null;

export const formatProvinceLabel = (province = "") => getProvinceRecord(province)?.label || "";

export const formatDistrictLabel = (province = "", district = "") =>
  getDistrictRecord(province, district)?.label || "";

export const isSupportedProvince = (province = "") => Boolean(getProvinceRecord(province));

export const isValidProvinceDistrictPair = (province = "", district = "") =>
  Boolean(getDistrictRecord(province, district));

export const parseLegacyDeliveryAddressText = (text = "") => {
  const normalizedText = normalizeLocationToken(text);

  if (!normalizedText) {
    return {
      province: "",
      district: ""
    };
  }

  let matchedProvince = "";
  let matchedDistrict = "";

  for (const province of deliveryZoneConfig) {
    const provinceCandidates = [province.normalizedValue, province.normalizedLabel];
    const provinceInText = findTokenInText(normalizedText, provinceCandidates);
    const districtInText = findTokenInText(
      normalizedText,
      province.districts.flatMap((district) => [district.normalizedValue, district.normalizedLabel])
    );

    if (!matchedProvince && districtInText) {
      matchedProvince = province.value;
      matchedDistrict = normalizedDistrictLookup.get(`${province.value}:${districtInText}`) || "";
      break;
    }

    if (!matchedProvince && provinceInText) {
      matchedProvince = province.value;
    }
  }

  if (matchedProvince && !matchedDistrict) {
    for (const district of getDistrictOptions(matchedProvince)) {
      const districtCandidates = [
        normalizeLocationToken(district.value),
        normalizeLocationToken(district.label)
      ];

      const districtInText = findTokenInText(normalizedText, districtCandidates);

      if (districtInText) {
        matchedDistrict = district.value;
        break;
      }
    }
  }

  return {
    province: matchedProvince,
    district: matchedDistrict
  };
};

export const getDeliveryRegionByProvinceDistrict = (province = "", district = "") =>
  getDistrictRecord(province, district)?.regionKey || "";

export const isFreeDeliveryRegion = (regionKey = "") => regionKey === DELIVERY_REGION_KEYS.ISTANBUL_ANATOLIAN;

export const requiresMinimumOrder = (regionKey = "") =>
  MINIMUM_ORDER_REQUIRED_REGION_KEYS.includes(regionKey);

export const getMinimumOrderRuleStatus = ({
  province = "",
  district = "",
  subtotal = 0,
  fallbackDeliveryFee = 0
} = {}) => {
  const normalizedProvince = normalizeProvinceValue(province);
  const normalizedDistrict = normalizeDistrictValue(normalizedProvince, district);
  const regionKey = getDeliveryRegionByProvinceDistrict(normalizedProvince, normalizedDistrict);
  const subtotalCents = toCurrencyMinorUnits(subtotal);
  const minimumOrderCents = requiresMinimumOrder(regionKey) ? EUROPEAN_SIDE_MINIMUM_ORDER_CENTS : 0;
  const remainingCents = Math.max(0, minimumOrderCents - subtotalCents);
  const deliveryFee = isFreeDeliveryRegion(regionKey) ? 0 : Number(fallbackDeliveryFee || 0);

  return {
    province: normalizedProvince,
    district: normalizedDistrict,
    provinceLabel: formatProvinceLabel(normalizedProvince),
    districtLabel: formatDistrictLabel(normalizedProvince, normalizedDistrict),
    regionKey,
    regionLabel: DELIVERY_REGION_LABELS[regionKey] || "",
    subtotal,
    subtotalCents,
    minimumOrderCents,
    minimumOrderAmount: fromCurrencyMinorUnits(minimumOrderCents),
    remainingCents,
    remainingAmount: fromCurrencyMinorUnits(remainingCents),
    requiresMinimumOrder: requiresMinimumOrder(regionKey),
    isFreeDelivery: isFreeDeliveryRegion(regionKey),
    deliveryFee,
    meetsMinimumOrder: remainingCents === 0,
    isBlocked: requiresMinimumOrder(regionKey) && remainingCents > 0
  };
};
