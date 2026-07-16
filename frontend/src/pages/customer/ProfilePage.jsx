import { useEffect, useMemo, useState } from "react";
import DeliveryAddressFields from "../../components/DeliveryAddressFields";
import { useAuth } from "../../context/AuthContext";
import { getApiErrorMessage } from "../../utils/apiErrors";
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
  const [form, setForm] = useState(() => buildProfileForm(user));
  const [savedForm, setSavedForm] = useState(() => buildProfileForm(user));
  const [profileReady, setProfileReady] = useState(() => Boolean(user));
  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!authReady) {
      return undefined;
    }

    if (user) {
      const nextForm = buildProfileForm(user);
      setForm(nextForm);
      setSavedForm(nextForm);
      setProfileReady(true);
    }

    let cancelled = false;

    const syncProfile = async () => {
      const refreshedUser = await refreshProfile();
      const nextForm = buildProfileForm(refreshedUser || user || null);

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
  }, [authReady]);

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
    return <section className="panel">Profil bilgileriniz yukleniyor...</section>;
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
            <input
              placeholder="Ad"
              value={form.firstName}
              onChange={(event) => handleAccountChange("firstName", event.target.value)}
              disabled={!editing}
              required
            />
            <input
              placeholder="Soyad"
              value={form.lastName}
              onChange={(event) => handleAccountChange("lastName", event.target.value)}
              disabled={!editing}
              required
            />
            <input
              type="email"
              placeholder="E-posta"
              value={form.email}
              onChange={(event) => handleAccountChange("email", event.target.value)}
              disabled={!editing}
              required
            />
            <input
              placeholder="Telefon"
              value={form.phone}
              onChange={(event) => handleAccountChange("phone", event.target.value)}
              disabled={!editing}
              required
            />
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
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Eski şifre"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                }
                required
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Yeni şifre"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
                required
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Yeni şifre tekrar"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                }
                required
              />
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
            <input
              placeholder="Fatura ad soyad"
              value={form.billingAddress.fullName}
              onChange={(event) => handleBillingAddressChange("fullName", event.target.value)}
              disabled={!editing}
            />
            <input
              placeholder="Şirket adı"
              value={form.billingAddress.companyName}
              onChange={(event) => handleBillingAddressChange("companyName", event.target.value)}
              disabled={!editing}
            />
            <input
              placeholder="Vergi dairesi"
              value={form.billingAddress.taxOffice}
              onChange={(event) => handleBillingAddressChange("taxOffice", event.target.value)}
              disabled={!editing}
            />
            <input
              placeholder="Vergi numarası"
              value={form.billingAddress.taxNumber}
              onChange={(event) => handleBillingAddressChange("taxNumber", event.target.value)}
              disabled={!editing}
            />
            <input
              type="email"
              placeholder="Fatura e-postası"
              value={form.billingAddress.email}
              onChange={(event) => handleBillingAddressChange("email", event.target.value)}
              disabled={!editing}
            />
            <input
              placeholder="Fatura telefonu"
              value={form.billingAddress.phone}
              onChange={(event) => handleBillingAddressChange("phone", event.target.value)}
              disabled={!editing}
            />
          </div>
          <textarea
            placeholder="Fatura adresi"
            value={form.billingAddress.billingAddress}
            onChange={(event) => handleBillingAddressChange("billingAddress", event.target.value)}
            disabled={!editing}
          />
        </article>

        {error && <p className="error-text">{error}</p>}
        {successMessage && <p className="success-banner">{successMessage}</p>}

        <div className="inline-actions">
          <button type="button" className="ghost-button" onClick={() => setEditing(true)}>
            Düzenle
          </button>
          <button type="submit" className="primary-button" disabled={!editing && !changingPassword}>
            Kaydet
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
