import { useEffect, useId, useMemo, useRef, useState } from "react";
import DeliveryAddressFields from "../../components/DeliveryAddressFields";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/apiErrors";
import {
  PASSWORD_MIN_LENGTH,
  PHONE_INPUT_PATTERN,
  PHONE_INPUT_TITLE,
  getPasswordValidationMessage,
  getPhoneValidationMessage,
  isValidPasswordLength,
  isValidProfilePhone
} from "../../utils/accountValidation";
import { buildProfileForm } from "../../utils/deliveryAddressForms";
import {
  hasCompleteDeliveryAddress,
  hasCompleteBillingAddress
} from "../../../../shared/profile.js";

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const ProfilePage = () => {
  const { authReady, user, refreshProfile, updateProfile, changePassword } = useAuth();
  const formId = useId();
  const [form, setForm] = useState(() => buildProfileForm(user));
  const [savedForm, setSavedForm] = useState(() => buildProfileForm(user));
  const [profileReady, setProfileReady] = useState(() => Boolean(user));
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!authReady) {
      return undefined;
    }

    if (userRef.current) {
      const nextForm = buildProfileForm(userRef.current);
      setForm(nextForm);
      setSavedForm(nextForm);
      setProfileReady(true);
    }

    let cancelled = false;

    const syncProfile = async () => {
      const refreshedUser = await refreshProfile();
      const nextForm = buildProfileForm(refreshedUser || userRef.current || null);

      if (cancelled) {
        return;
      }
      setForm(nextForm);
      setSavedForm(nextForm);
      setProfileReady(true);
    };

    syncProfile();

    return () => {
      cancelled = true;
    };
  }, [authReady, refreshProfile]);

  useEffect(() => {
    if (!user || editing || changingPassword) {
      return;
    }

    const nextForm = buildProfileForm(user);
    setForm(nextForm);
    setSavedForm(nextForm);
    setProfileReady(true);
  }, [changingPassword, editing, user]);

  const billingAddressComplete = useMemo(
    () => hasCompleteBillingAddress(form.billingAddress),
    [form.billingAddress]
  );
  const deliveryAddressComplete = useMemo(
    () => hasCompleteDeliveryAddress(form.deliveryAddress),
    [form.deliveryAddress]
  );

  const handleAccountChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleBillingAddressChange = (field, value) => {
    setForm((current) => ({
      ...current,
      billingAddress: {
        ...current.billingAddress,
        [field]: value
      }
    }));
  };

  const handleCancel = () => {
    setForm(savedForm);
    setEditing(false);
    setChangingPassword(false);
    setPasswordForm(emptyPasswordForm);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!isValidProfilePhone(form.phone)) {
      setError(getPhoneValidationMessage("Telefon numarası"));
      return;
    }

    if (form.billingAddress.phone && !isValidProfilePhone(form.billingAddress.phone)) {
      setError(getPhoneValidationMessage("Fatura telefonu"));
      return;
    }

    if (changingPassword && passwordForm.newPassword && !isValidPasswordLength(passwordForm.newPassword)) {
      setError(getPasswordValidationMessage());
      return;
    }

    if (changingPassword && passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    try {
      const { user: updatedUser } = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        deliveryAddress: form.deliveryAddress,
        billingAddress: form.billingAddress
      });

      if (changingPassword && passwordForm.currentPassword && passwordForm.newPassword) {
        await changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });
      }

      const refreshedUser = (await refreshProfile()) || updatedUser || user;
      const nextForm = buildProfileForm(refreshedUser || null);

      setForm(nextForm);
      setSavedForm(nextForm);
      setEditing(false);
      setChangingPassword(false);
      setPasswordForm(emptyPasswordForm);
      setSuccessMessage("Profil bilgileri kaydedildi.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Profil kaydedilemedi."));
    }
  };

  if (!profileReady) {
    return <LoadingState message="Profil bilgileriniz yükleniyor..." />;
  }

  return (
    <section className="stack-lg">
      <div className="page-header">
        <span className="eyebrow">Profil</span>
        <h1>Hesabım</h1>
        <p>Hesap, teslimat ve fatura adresi bilgilerinizi buradan yönetin.</p>
      </div>

      <form className="stack-md" onSubmit={handleSubmit}>
        <article className="panel profile-card">
          <div className="section-heading">
            <span className="eyebrow">Hesap Bilgileri</span>
            <h2>Hesap Bilgileri</h2>
          </div>
          <div className="form-grid">
            <label className="stack-xs form-field" htmlFor={`${formId}-first-name`}>
              <span>Ad *</span>
              <input
                id={`${formId}-first-name`}
                value={form.firstName}
                onChange={(event) => handleAccountChange("firstName", event.target.value)}
                disabled={!editing}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-last-name`}>
              <span>Soyad *</span>
              <input
                id={`${formId}-last-name`}
                value={form.lastName}
                onChange={(event) => handleAccountChange("lastName", event.target.value)}
                disabled={!editing}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-email`}>
              <span>E-posta *</span>
              <input
                id={`${formId}-email`}
                type="email"
                value={form.email}
                onChange={(event) => handleAccountChange("email", event.target.value)}
                disabled={!editing}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-phone`}>
              <span>Telefon *</span>
              <input
                id={`${formId}-phone`}
                value={form.phone}
                onChange={(event) => handleAccountChange("phone", event.target.value)}
                disabled={!editing}
                required
                pattern={PHONE_INPUT_PATTERN}
                title={PHONE_INPUT_TITLE}
              />
            </label>
          </div>

          <div className="profile-password-block">
            <input
              type={showPassword ? "text" : "password"}
              value="********"
              readOnly
              disabled
              aria-label="Kayıtlı şifre"
            />
            <div className="inline-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setChangingPassword((current) => !current);
                  setEditing(true);
                }}
              >
                Şifreyi Değiştir
              </button>
            </div>
          </div>

          {changingPassword && (
            <div className="form-grid">
              <label className="stack-xs form-field" htmlFor={`${formId}-current-password`}>
                <span>Mevcut şifre *</span>
                <input
                  id={`${formId}-current-password`}
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="stack-xs form-field" htmlFor={`${formId}-new-password`}>
                <span>Yeni şifre *</span>
                <input
                  id={`${formId}-new-password`}
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  title={getPasswordValidationMessage()}
                />
              </label>
              <label className="stack-xs form-field" htmlFor={`${formId}-confirm-password`}>
                <span>Yeni şifre tekrar *</span>
                <input
                  id={`${formId}-confirm-password`}
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  title={getPasswordValidationMessage()}
                />
              </label>
            </div>
          )}
        </article>

        <article className="panel profile-card">
          <div className="section-heading">
            <span className="eyebrow">Teslimat Adresi</span>
            <h2>Teslimat Adresi</h2>
          </div>
          {!deliveryAddressComplete && (
            <div className="info-banner">
              Teslimat için il, ilçe, mahalle ve açık adres bilgilerini eksiksiz girmeniz gerekir.
            </div>
          )}
          <DeliveryAddressFields
            value={form.deliveryAddress}
            onChange={(deliveryAddress) => handleAccountChange("deliveryAddress", deliveryAddress)}
            disabled={!editing}
            idPrefix={`${formId}-delivery`}
            required
          />
        </article>

        <article className="panel profile-card">
          <div className="section-heading">
            <span className="eyebrow">Fatura Bilgileri</span>
            <h2>Fatura Bilgileri</h2>
          </div>
          {!billingAddressComplete && (
            <div className="info-banner">Sipariş verebilmek için bu bölümdeki tüm alanları doldurmanız gerekir.</div>
          )}
          <div className="form-grid">
            <label className="stack-xs form-field" htmlFor={`${formId}-billing-full-name`}>
              <span>Fatura ad soyad</span>
              <input
                id={`${formId}-billing-full-name`}
                value={form.billingAddress.fullName}
                onChange={(event) => handleBillingAddressChange("fullName", event.target.value)}
                disabled={!editing}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-billing-company-name`}>
              <span>Şirket adı</span>
              <input
                id={`${formId}-billing-company-name`}
                value={form.billingAddress.companyName}
                onChange={(event) => handleBillingAddressChange("companyName", event.target.value)}
                disabled={!editing}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-billing-tax-office`}>
              <span>Vergi dairesi</span>
              <input
                id={`${formId}-billing-tax-office`}
                value={form.billingAddress.taxOffice}
                onChange={(event) => handleBillingAddressChange("taxOffice", event.target.value)}
                disabled={!editing}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-billing-tax-number`}>
              <span>Vergi numarası</span>
              <input
                id={`${formId}-billing-tax-number`}
                value={form.billingAddress.taxNumber}
                onChange={(event) => handleBillingAddressChange("taxNumber", event.target.value)}
                disabled={!editing}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-billing-email`}>
              <span>Fatura e-postası</span>
              <input
                id={`${formId}-billing-email`}
                type="email"
                value={form.billingAddress.email}
                onChange={(event) => handleBillingAddressChange("email", event.target.value)}
                disabled={!editing}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-billing-phone`}>
              <span>Fatura telefonu</span>
              <input
                id={`${formId}-billing-phone`}
                value={form.billingAddress.phone}
                onChange={(event) => handleBillingAddressChange("phone", event.target.value)}
                disabled={!editing}
                pattern={PHONE_INPUT_PATTERN}
                title={PHONE_INPUT_TITLE}
              />
            </label>
          </div>
          <label className="stack-xs form-field" htmlFor={`${formId}-billing-address`}>
            <span>Fatura adresi</span>
            <textarea
              id={`${formId}-billing-address`}
              value={form.billingAddress.billingAddress}
              onChange={(event) => handleBillingAddressChange("billingAddress", event.target.value)}
              disabled={!editing}
            />
          </label>
        </article>

        <FormMessage type="error" message={error} />
        <FormMessage type="success" message={successMessage} />

        <div className="inline-actions">
          <button type="button" className="ghost-button" onClick={() => setEditing(true)}>
            Düzenle
          </button>
          <button type="submit" className="primary-button" disabled={!editing && !changingPassword}>
            {changingPassword ? "Bilgileri ve şifreyi kaydet" : "Bilgileri Kaydet"}
          </button>
          <button type="button" className="ghost-button" onClick={handleCancel} disabled={!editing && !changingPassword}>
            İptal
          </button>
        </div>
      </form>
    </section>
  );
};

export default ProfilePage;
