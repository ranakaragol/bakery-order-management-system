import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/client";
import ErrorState from "../../components/ErrorState";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import { useAuth } from "../../context/AuthContext";
import {
  PASSWORD_MIN_LENGTH,
  PHONE_INPUT_PATTERN,
  PHONE_INPUT_TITLE,
  getPasswordValidationMessage,
  getPhoneValidationMessage,
  isValidPasswordLength,
  isValidProfilePhone
} from "../../utils/accountValidation";
import { getApiErrorMessage } from "../../utils/apiErrors";
import { fallbackContactInfo, mergeSiteContent } from "../../utils/fallbackContent";

const buildAccountForm = (user = null) => ({
  firstName: user?.firstName || "",
  lastName: user?.lastName || "",
  email: user?.email || "",
  phone: user?.phone || "",
  address: user?.address || ""
});

const buildSiteSettingsForm = (contactInfo = fallbackContactInfo) => {
  const resolved = mergeSiteContent(contactInfo);

  return {
    heroTitle: resolved.heroTitle || "",
    heroDescription: resolved.heroDescription || "",
    phone: resolved.phone || "",
    email: resolved.email || "",
    address: resolved.address || "",
    workingHours: resolved.workingHours || "",
    mapUrl: resolved.mapUrl || "",
    socialLinks: {
      instagram: resolved.socialLinks?.instagram || "",
      facebook: resolved.socialLinks?.facebook || "",
      whatsapp: resolved.socialLinks?.whatsapp || ""
    },
    paymentDetails: {
      accountHolder: resolved.paymentDetails?.accountHolder || "",
      bankName: resolved.paymentDetails?.bankName || "",
      iban: resolved.paymentDetails?.iban || ""
    },
    aboutContent: {
      titleTr: resolved.aboutContent?.titleTr || "",
      bodyTr: resolved.aboutContent?.bodyTr || "",
      titleEn: resolved.aboutContent?.titleEn || "",
      bodyEn: resolved.aboutContent?.bodyEn || ""
    }
  };
};

const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

const AdminProfilePage = () => {
  const outletContext = useOutletContext();
  const { user, refreshProfile, updateProfile, changePassword } = useAuth();
  const formId = useId();
  const [accountForm, setAccountForm] = useState(() => buildAccountForm(user));
  const [savedAccountForm, setSavedAccountForm] = useState(() => buildAccountForm(user));
  const [siteForm, setSiteForm] = useState(() => buildSiteSettingsForm());
  const [savedSiteForm, setSavedSiteForm] = useState(() => buildSiteSettingsForm());
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadPageData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [refreshedUser, siteSettingsResponse] = await Promise.all([
        refreshProfile(),
        api.get("/admin/contact")
      ]);

      const nextAccountForm = buildAccountForm(refreshedUser || userRef.current);
      const nextSiteForm = buildSiteSettingsForm(siteSettingsResponse.data);

      setAccountForm(nextAccountForm);
      setSavedAccountForm(nextAccountForm);
      setSiteForm(nextSiteForm);
      setSavedSiteForm(nextSiteForm);
      outletContext?.setContactInfo?.(mergeSiteContent(siteSettingsResponse.data));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Bilgiler yüklenemedi."));
    } finally {
      setLoading(false);
    }
  }, [outletContext, refreshProfile]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    if (!user || editing) {
      return;
    }

    const nextAccountForm = buildAccountForm(user);
    setAccountForm(nextAccountForm);
    setSavedAccountForm(nextAccountForm);
  }, [editing, user]);

  const handleAccountChange = (field, value) => {
    setAccountForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSiteChange = (field, value) => {
    setSiteForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleNestedSiteChange = (group, field, value) => {
    setSiteForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [field]: value
      }
    }));
  };

  const handleCancel = () => {
    setAccountForm(savedAccountForm);
    setSiteForm(savedSiteForm);
    setEditing(false);
    setChangingPassword(false);
    setShowPassword(false);
    setPasswordForm(emptyPasswordForm);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!isValidProfilePhone(accountForm.phone)) {
      setError(getPhoneValidationMessage("Telefon numarası"));
      return;
    }

    if (siteForm.phone && !isValidProfilePhone(siteForm.phone)) {
      setError(getPhoneValidationMessage("Site telefonu"));
      return;
    }

    if (changingPassword) {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        setError("Şifre değiştirmek için tüm şifre alanlarını doldurunuz.");
        return;
      }

      if (!isValidPasswordLength(passwordForm.newPassword)) {
        setError(getPasswordValidationMessage());
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("Yeni şifreler birbiriyle eşleşmiyor.");
        return;
      }
    }

    try {
      setIsSaving(true);
      await updateProfile(accountForm);

      if (changingPassword) {
        await changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });
      }

      await api.put("/admin/contact", siteForm);
      outletContext?.setContactInfo?.(mergeSiteContent(siteForm));

      const refreshedUser = await refreshProfile();
      const nextAccountForm = buildAccountForm(refreshedUser || user);

      setAccountForm(nextAccountForm);
      setSavedAccountForm(nextAccountForm);
      setSiteForm(siteForm);
      setSavedSiteForm(siteForm);
      setEditing(false);
      setChangingPassword(false);
      setShowPassword(false);
      setPasswordForm(emptyPasswordForm);
      setSuccessMessage("Admin profili ve site bilgileri güncellendi.");
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "İşlem tamamlanamadı."));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Admin profil ve site ayarları yükleniyor..." />;
  }

  if (error && !editing && !savedSiteForm.heroTitle) {
    return <ErrorState message={error} onRetry={loadPageData} />;
  }

  return (
    <section className="stack-lg">
      <div className="page-header page-header--admin">
        <span className="eyebrow">Admin Profili</span>
        <h1>Hesap ve site ayarları</h1>
        <p>Hakkımızda, iletişim ve ödeme bilgilerini tek yerden güncelleyebilirsiniz.</p>
      </div>

      <FormMessage type="success" message={successMessage} />
      <FormMessage type="error" message={error} />

      <form className="stack-md" onSubmit={handleSubmit}>
        <article className="panel profile-card">
          <div className="section-heading">
            <span className="eyebrow">Hesap</span>
            <h2>Admin hesap bilgileri</h2>
          </div>
          <div className="form-grid">
            <label className="stack-xs form-field" htmlFor={`${formId}-first-name`}>
              <span>Ad *</span>
              <input
                id={`${formId}-first-name`}
                value={accountForm.firstName}
                onChange={(event) => handleAccountChange("firstName", event.target.value)}
                disabled={!editing || isSaving}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-last-name`}>
              <span>Soyad *</span>
              <input
                id={`${formId}-last-name`}
                value={accountForm.lastName}
                onChange={(event) => handleAccountChange("lastName", event.target.value)}
                disabled={!editing || isSaving}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-email`}>
              <span>E-posta *</span>
              <input
                id={`${formId}-email`}
                type="email"
                value={accountForm.email}
                onChange={(event) => handleAccountChange("email", event.target.value)}
                disabled={!editing || isSaving}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-phone`}>
              <span>Telefon *</span>
              <input
                id={`${formId}-phone`}
                value={accountForm.phone}
                onChange={(event) => handleAccountChange("phone", event.target.value)}
                disabled={!editing || isSaving}
                required
                pattern={PHONE_INPUT_PATTERN}
                title={PHONE_INPUT_TITLE}
              />
            </label>
          </div>
          <label className="stack-xs form-field" htmlFor={`${formId}-address`}>
            <span>Adres *</span>
            <textarea
              id={`${formId}-address`}
              value={accountForm.address}
              onChange={(event) => handleAccountChange("address", event.target.value)}
              disabled={!editing || isSaving}
              required
            />
          </label>

          <div className="profile-password-block">
            <input type={showPassword ? "text" : "password"} value="********" readOnly disabled />
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
                  disabled={isSaving}
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
            <span className="eyebrow">Ana Sayfa ve İletişim</span>
            <h2>Genel site bilgileri</h2>
          </div>
          <div className="form-grid">
            <label className="stack-xs form-field" htmlFor={`${formId}-hero-title`}>
              <span>Hero başlığı *</span>
              <input
                id={`${formId}-hero-title`}
                value={siteForm.heroTitle}
                onChange={(event) => handleSiteChange("heroTitle", event.target.value)}
                disabled={!editing || isSaving}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-site-phone`}>
              <span>Telefon *</span>
              <input
                id={`${formId}-site-phone`}
                value={siteForm.phone}
                onChange={(event) => handleSiteChange("phone", event.target.value)}
                disabled={!editing || isSaving}
                required
                pattern={PHONE_INPUT_PATTERN}
                title={PHONE_INPUT_TITLE}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-site-email`}>
              <span>E-posta *</span>
              <input
                id={`${formId}-site-email`}
                type="email"
                value={siteForm.email}
                onChange={(event) => handleSiteChange("email", event.target.value)}
                disabled={!editing || isSaving}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-working-hours`}>
              <span>Çalışma saatleri *</span>
              <input
                id={`${formId}-working-hours`}
                value={siteForm.workingHours}
                onChange={(event) => handleSiteChange("workingHours", event.target.value)}
                disabled={!editing || isSaving}
                required
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-instagram`}>
              <span>Instagram</span>
              <input
                id={`${formId}-instagram`}
                value={siteForm.socialLinks.instagram}
                onChange={(event) => handleNestedSiteChange("socialLinks", "instagram", event.target.value)}
                disabled={!editing || isSaving}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-facebook`}>
              <span>Facebook</span>
              <input
                id={`${formId}-facebook`}
                value={siteForm.socialLinks.facebook}
                onChange={(event) => handleNestedSiteChange("socialLinks", "facebook", event.target.value)}
                disabled={!editing || isSaving}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-whatsapp`}>
              <span>WhatsApp</span>
              <input
                id={`${formId}-whatsapp`}
                value={siteForm.socialLinks.whatsapp}
                onChange={(event) => handleNestedSiteChange("socialLinks", "whatsapp", event.target.value)}
                disabled={!editing || isSaving}
              />
            </label>
            <label className="stack-xs form-field" htmlFor={`${formId}-map-url`}>
              <span>Harita bağlantısı</span>
              <input
                id={`${formId}-map-url`}
                value={siteForm.mapUrl}
                onChange={(event) => handleSiteChange("mapUrl", event.target.value)}
                disabled={!editing || isSaving}
              />
            </label>
          </div>
          <label className="stack-xs form-field" htmlFor={`${formId}-hero-description`}>
            <span>Hero açıklaması *</span>
            <textarea
              id={`${formId}-hero-description`}
              value={siteForm.heroDescription}
              onChange={(event) => handleSiteChange("heroDescription", event.target.value)}
              disabled={!editing || isSaving}
              required
            />
          </label>
          <label className="stack-xs form-field" htmlFor={`${formId}-site-address`}>
            <span>İletişim adresi veya açıklaması *</span>
            <textarea
              id={`${formId}-site-address`}
              value={siteForm.address}
              onChange={(event) => handleSiteChange("address", event.target.value)}
              disabled={!editing || isSaving}
              required
            />
          </label>
        </article>

        <article className="panel profile-card">
          <div className="section-heading">
            <span className="eyebrow">Ödeme</span>
            <h2>Havale bilgileri</h2>
          </div>
          <div className="form-grid">
            <input
              placeholder="IBAN ad soyad"
              value={siteForm.paymentDetails.accountHolder}
              onChange={(event) => handleNestedSiteChange("paymentDetails", "accountHolder", event.target.value)}
              disabled={!editing}
              required
            />
            <input
              placeholder="Banka adı"
              value={siteForm.paymentDetails.bankName}
              onChange={(event) => handleNestedSiteChange("paymentDetails", "bankName", event.target.value)}
              disabled={!editing}
              required
            />
          </div>
          <input
            placeholder="IBAN"
            value={siteForm.paymentDetails.iban}
            onChange={(event) => handleNestedSiteChange("paymentDetails", "iban", event.target.value)}
            disabled={!editing}
            required
          />
        </article>

        <article className="panel profile-card">
          <div className="section-heading">
            <span className="eyebrow">Hakkımızda</span>
            <h2>Hakkımızda içerikleri</h2>
          </div>
          <div className="form-grid">
            <input
              placeholder="Türkçe başlık"
              value={siteForm.aboutContent.titleTr}
              onChange={(event) => handleNestedSiteChange("aboutContent", "titleTr", event.target.value)}
              disabled={!editing}
              required
            />
            <input
              placeholder="İngilizce başlık"
              value={siteForm.aboutContent.titleEn}
              onChange={(event) => handleNestedSiteChange("aboutContent", "titleEn", event.target.value)}
              disabled={!editing}
              required
            />
          </div>
          <textarea
            className="admin-textarea admin-textarea--tall"
            placeholder="Türkçe hakkımızda metni"
            value={siteForm.aboutContent.bodyTr}
            onChange={(event) => handleNestedSiteChange("aboutContent", "bodyTr", event.target.value)}
            disabled={!editing}
            required
          />
          <textarea
            className="admin-textarea admin-textarea--tall"
            placeholder="İngilizce hakkımızda metni"
            value={siteForm.aboutContent.bodyEn}
            onChange={(event) => handleNestedSiteChange("aboutContent", "bodyEn", event.target.value)}
            disabled={!editing}
            required
          />
        </article>

        <div className="inline-actions">
          {!editing ? (
            <button type="button" className="ghost-button" onClick={() => setEditing(true)}>
              Düzenle
            </button>
          ) : (
            <>
              <button type="submit" className="primary-button">
                Kaydet
              </button>
              <button type="button" className="ghost-button" onClick={handleCancel}>
                İptal
              </button>
            </>
          )}
        </div>
      </form>
    </section>
  );
};

export default AdminProfilePage;
