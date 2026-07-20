import { useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DeliveryAddressFields from "../../components/DeliveryAddressFields";
import FormMessage from "../../components/FormMessage";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage, getApiFieldErrors } from "../../utils/apiErrors";
import {
  PASSWORD_MIN_LENGTH,
  PHONE_INPUT_PATTERN,
  PHONE_INPUT_TITLE,
  getPasswordValidationMessage,
  getPhoneValidationMessage,
  isValidPasswordLength,
  isValidProfilePhone
} from "../../utils/accountValidation";
import { createEmptyDeliveryAddress } from "../../../../shared/profile.js";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  deliveryAddress: createEmptyDeliveryAddress()
};

const RegisterPage = () => {
  const formId = useId().replace(/:/g, "");
  const firstInvalidFieldRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const nextPath = searchParams.get("next");
  const intent = searchParams.get("intent");
  const loginLink = `/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!isValidProfilePhone(form.phone)) {
      setFieldErrors({ phone: getPhoneValidationMessage("Telefon numarası") });
      setError(getPhoneValidationMessage("Telefon numarası"));
      return;
    }

    if (!isValidPasswordLength(form.password)) {
      setFieldErrors({ password: getPasswordValidationMessage() });
      setError(getPasswordValidationMessage());
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Şifreler eşleşmiyor." });
      setError("Şifreler eşleşmiyor.");
      return;
    }

    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone,
        deliveryAddress: form.deliveryAddress
      });
      navigate(nextPath || "/");
    } catch (requestError) {
      setFieldErrors(getApiFieldErrors(requestError));
      setError(getApiErrorMessage(requestError, "Kayıt işlemi tamamlanamadı."));
      firstInvalidFieldRef.current?.focus();
    }
  };

  return (
    <section className="auth-shell">
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <div className="auth-intro">
          <span className="eyebrow">Yeni Üyelik</span>
          <h1 className="auth-title">Müşteri hesabı oluşturun</h1>
          <p className="auth-subtitle">Siparişlerinizi takip etmek ve alışverişe hızlıca başlamak için kaydolun.</p>
        </div>
        <div className="info-banner">
          Fatura bilgileri bu aşamada alınmıyor. İlk siparişinizi oluştururken gerekli alanları doldurabilirsiniz.
        </div>
        {intent === "cart" && (
          <div className="helper-text helper-text--panel">
            Hesabınızı oluşturduktan sonra ürün detayına dönüp sepete eklemeye devam edebilirsiniz.
          </div>
        )}
        <div className="form-grid">
          <label className="stack-xs form-field" htmlFor={`${formId}-firstName`}>
            <span>Ad *</span>
            <input
              ref={firstInvalidFieldRef}
              id={`${formId}-firstName`}
              name="firstName"
              placeholder="Adınız"
              required
              value={form.firstName}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.firstName)}
              aria-describedby={fieldErrors.firstName ? `${formId}-firstName-error` : undefined}
            />
            {fieldErrors.firstName && <small id={`${formId}-firstName-error`} className="field-error-text">{fieldErrors.firstName}</small>}
          </label>
          <label className="stack-xs form-field" htmlFor={`${formId}-lastName`}>
            <span>Soyad *</span>
            <input
              id={`${formId}-lastName`}
              name="lastName"
              placeholder="Soyadınız"
              required
              value={form.lastName}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.lastName)}
              aria-describedby={fieldErrors.lastName ? `${formId}-lastName-error` : undefined}
            />
            {fieldErrors.lastName && <small id={`${formId}-lastName-error`} className="field-error-text">{fieldErrors.lastName}</small>}
          </label>
          <label className="stack-xs form-field" htmlFor={`${formId}-email`}>
            <span>E-posta *</span>
            <input
              id={`${formId}-email`}
              name="email"
              type="email"
              placeholder="ornek@pasali.com"
              required
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? `${formId}-email-error` : undefined}
            />
            {fieldErrors.email && <small id={`${formId}-email-error`} className="field-error-text">{fieldErrors.email}</small>}
          </label>
          <label className="stack-xs form-field" htmlFor={`${formId}-phone`}>
            <span>Telefon numarası *</span>
            <input
              id={`${formId}-phone`}
              name="phone"
              placeholder="05xx xxx xx xx"
              required
              value={form.phone}
              onChange={handleChange}
              pattern={PHONE_INPUT_PATTERN}
              title={PHONE_INPUT_TITLE}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? `${formId}-phone-error` : undefined}
            />
            {fieldErrors.phone && <small id={`${formId}-phone-error`} className="field-error-text">{fieldErrors.phone}</small>}
          </label>
          <label className="stack-xs form-field" htmlFor={`${formId}-password`}>
            <span>Şifre *</span>
            <input
              id={`${formId}-password`}
              name="password"
              type="password"
              placeholder="En az 8 karakter"
              required
              value={form.password}
              onChange={handleChange}
              minLength={PASSWORD_MIN_LENGTH}
              title={getPasswordValidationMessage()}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? `${formId}-password-error` : undefined}
            />
            {fieldErrors.password && <small id={`${formId}-password-error`} className="field-error-text">{fieldErrors.password}</small>}
          </label>
          <label className="stack-xs form-field" htmlFor={`${formId}-confirmPassword`}>
            <span>Şifre tekrarı *</span>
            <input
              id={`${formId}-confirmPassword`}
              name="confirmPassword"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              minLength={PASSWORD_MIN_LENGTH}
              title={getPasswordValidationMessage()}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? `${formId}-confirmPassword-error` : undefined}
            />
            {fieldErrors.confirmPassword && (
              <small id={`${formId}-confirmPassword-error`} className="field-error-text">
                {fieldErrors.confirmPassword}
              </small>
            )}
          </label>
        </div>
        <DeliveryAddressFields
          value={form.deliveryAddress}
          onChange={(deliveryAddress) => setForm((current) => ({ ...current, deliveryAddress }))}
          required
          idPrefix={`${formId}-delivery`}
        />
        <FormMessage id={`${formId}-error`} type="error" message={error} />
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
        </button>
        <p>
          Zaten hesabınız var mı?{" "}
          <Link to={loginLink} className="auth-link-subtle">
            Giriş yapın
          </Link>
        </p>
      </form>
    </section>
  );
};

export default RegisterPage;
