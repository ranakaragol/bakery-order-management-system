import {
  getDistrictOptions,
  getProvinceOptions
} from "../../../shared/deliveryZones.js";
import {
  createEmptyDeliveryAddress,
  normalizeDeliveryAddress
} from "../../../shared/profile.js";

const provinceOptions = getProvinceOptions();

const DeliveryAddressFields = ({
  value,
  onChange,
  disabled = false,
  required = false,
  addressTitleLabel = "Adres başlığı",
  addressTitlePlaceholder = "Ev, İş, Ofis",
  streetAddressLabel = "Açık adres",
  streetAddressPlaceholder = "Sokak, bina, kat ve daire bilgisi",
  neighborhoodLabel = "Mahalle",
  neighborhoodPlaceholder = "Mahalle bilgisi",
  postalCodeLabel = "Posta kodu",
  postalCodePlaceholder = "34000",
  provinceLabel = "İl",
  districtLabel = "İlçe"
}) => {
  const normalizedValue = normalizeDeliveryAddress(value || createEmptyDeliveryAddress());
  const districtOptions = getDistrictOptions(normalizedValue.province);

  const handleFieldChange = (field, nextValue) => {
    const nextAddress =
      field === "province"
        ? { ...normalizedValue, province: nextValue, district: "" }
        : { ...normalizedValue, [field]: nextValue };

    onChange?.(nextAddress);
  };

  return (
    <>
      <div className="form-grid">
        <label className="stack-xs">
          <span>{addressTitleLabel}</span>
          <input
            type="text"
            placeholder={addressTitlePlaceholder}
            value={normalizedValue.addressTitle}
            onChange={(event) => handleFieldChange("addressTitle", event.target.value)}
            disabled={disabled}
          />
        </label>

        <label className="stack-xs">
          <span>{provinceLabel}</span>
          <select
            value={normalizedValue.province}
            onChange={(event) => handleFieldChange("province", event.target.value)}
            disabled={disabled}
            required={required}
          >
            <option value="">İl seçiniz</option>
            {provinceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="stack-xs">
          <span>{districtLabel}</span>
          <select
            value={normalizedValue.district}
            onChange={(event) => handleFieldChange("district", event.target.value)}
            disabled={disabled || !normalizedValue.province}
            required={required}
          >
            <option value="">İlçe seçiniz</option>
            {districtOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-grid">
        <label className="stack-xs">
          <span>{neighborhoodLabel}</span>
          <input
            type="text"
            placeholder={neighborhoodPlaceholder}
            value={normalizedValue.neighborhood}
            onChange={(event) => handleFieldChange("neighborhood", event.target.value)}
            disabled={disabled}
            required={required}
          />
        </label>

        <label className="stack-xs">
          <span>{postalCodeLabel}</span>
          <input
            type="text"
            placeholder={postalCodePlaceholder}
            value={normalizedValue.postalCode}
            onChange={(event) => handleFieldChange("postalCode", event.target.value)}
            disabled={disabled}
            inputMode="numeric"
          />
        </label>
      </div>

      <textarea
        placeholder={streetAddressPlaceholder}
        value={normalizedValue.streetAddress}
        onChange={(event) => handleFieldChange("streetAddress", event.target.value)}
        disabled={disabled}
        required={required}
        aria-label={streetAddressLabel}
      />
    </>
  );
};

export default DeliveryAddressFields;
