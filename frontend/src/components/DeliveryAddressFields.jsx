import { useId } from "react";
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
  districtLabel = "İlçe",
  idPrefix = "delivery-address",
  fieldErrors = {}
}) => {
  const autoIdPrefix = useId().replace(/:/g, "");
  const resolvedIdPrefix = `${idPrefix}-${autoIdPrefix}`;
  const normalizedValue = normalizeDeliveryAddress(value || createEmptyDeliveryAddress());
  const districtOptions = getDistrictOptions(normalizedValue.province);
  const getFieldId = (field) => `${resolvedIdPrefix}-${field}`;
  const getErrorId = (field) => `${resolvedIdPrefix}-${field}-error`;
  const getFieldError = (field) => fieldErrors[field] || "";

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
        <label className="stack-xs form-field">
          <span>{addressTitleLabel}</span>
          <input
            id={getFieldId("addressTitle")}
            type="text"
            placeholder={addressTitlePlaceholder}
            value={normalizedValue.addressTitle}
            onChange={(event) => handleFieldChange("addressTitle", event.target.value)}
            disabled={disabled}
            aria-invalid={Boolean(getFieldError("addressTitle"))}
            aria-describedby={getFieldError("addressTitle") ? getErrorId("addressTitle") : undefined}
          />
          {getFieldError("addressTitle") && (
            <small id={getErrorId("addressTitle")} className="field-error-text">
              {getFieldError("addressTitle")}
            </small>
          )}
        </label>

        <label className="stack-xs form-field">
          <span>
            {provinceLabel}
            {required ? " *" : ""}
          </span>
          <select
            id={getFieldId("province")}
            value={normalizedValue.province}
            onChange={(event) => handleFieldChange("province", event.target.value)}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(getFieldError("province"))}
            aria-describedby={getFieldError("province") ? getErrorId("province") : undefined}
          >
            <option value="">İl seçiniz</option>
            {provinceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {getFieldError("province") && (
            <small id={getErrorId("province")} className="field-error-text">
              {getFieldError("province")}
            </small>
          )}
        </label>

        <label className="stack-xs form-field">
          <span>
            {districtLabel}
            {required ? " *" : ""}
          </span>
          <select
            id={getFieldId("district")}
            value={normalizedValue.district}
            onChange={(event) => handleFieldChange("district", event.target.value)}
            disabled={disabled || !normalizedValue.province}
            required={required}
            aria-invalid={Boolean(getFieldError("district"))}
            aria-describedby={getFieldError("district") ? getErrorId("district") : undefined}
          >
            <option value="">İlçe seçiniz</option>
            {districtOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {getFieldError("district") && (
            <small id={getErrorId("district")} className="field-error-text">
              {getFieldError("district")}
            </small>
          )}
        </label>
      </div>

      <div className="form-grid">
        <label className="stack-xs form-field">
          <span>
            {neighborhoodLabel}
            {required ? " *" : ""}
          </span>
          <input
            id={getFieldId("neighborhood")}
            type="text"
            placeholder={neighborhoodPlaceholder}
            value={normalizedValue.neighborhood}
            onChange={(event) => handleFieldChange("neighborhood", event.target.value)}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(getFieldError("neighborhood"))}
            aria-describedby={getFieldError("neighborhood") ? getErrorId("neighborhood") : undefined}
          />
          {getFieldError("neighborhood") && (
            <small id={getErrorId("neighborhood")} className="field-error-text">
              {getFieldError("neighborhood")}
            </small>
          )}
        </label>

        <label className="stack-xs form-field">
          <span>{postalCodeLabel}</span>
          <input
            id={getFieldId("postalCode")}
            type="text"
            placeholder={postalCodePlaceholder}
            value={normalizedValue.postalCode}
            onChange={(event) => handleFieldChange("postalCode", event.target.value)}
            disabled={disabled}
            inputMode="numeric"
            aria-invalid={Boolean(getFieldError("postalCode"))}
            aria-describedby={getFieldError("postalCode") ? getErrorId("postalCode") : undefined}
          />
          {getFieldError("postalCode") && (
            <small id={getErrorId("postalCode")} className="field-error-text">
              {getFieldError("postalCode")}
            </small>
          )}
        </label>
      </div>

      <label className="stack-xs form-field">
        <span>
          {streetAddressLabel}
          {required ? " *" : ""}
        </span>
        <textarea
          id={getFieldId("streetAddress")}
          placeholder={streetAddressPlaceholder}
          value={normalizedValue.streetAddress}
          onChange={(event) => handleFieldChange("streetAddress", event.target.value)}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(getFieldError("streetAddress"))}
          aria-describedby={getFieldError("streetAddress") ? getErrorId("streetAddress") : undefined}
        />
        {getFieldError("streetAddress") && (
          <small id={getErrorId("streetAddress")} className="field-error-text">
            {getFieldError("streetAddress")}
          </small>
        )}
      </label>
    </>
  );
};

export default DeliveryAddressFields;
