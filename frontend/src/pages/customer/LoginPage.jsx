import { useId, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import FormMessage from "../../components/FormMessage";
import { useAuth } from "../../context/AuthContext";
import { resolveNextPath } from "../../utils/authNavigation";
import { getApiErrorMessage } from "../../utils/apiErrors";

const LoginPage = () => {
  const formId = useId().replace(/:/g, "");
  const emailInputRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const nextPath = searchParams.get("next");
  const resolvedNextPath = resolveNextPath(nextPath);
  const intent = searchParams.get("intent");
  const registerLink = `/register${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const { user } = await login(form);
      if (user.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      navigate(resolvedNextPath);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Giriş yapılamadı."));
      emailInputRef.current?.focus();
    }
  };

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-intro">
          <span className="eyebrow">Tek Giriş</span>
          <h1 className="auth-title">Hesabınıza giriş yapın</h1>
          <p className="auth-subtitle">Müşteri hesabınıza veya yönetim panelinize güvenle erişin.</p>
        </div>
        {intent === "cart" && (
          <div className="info-banner">
            Sepete ürün eklemek için önce giriş yapmanız veya yeni hesap oluşturmanız gerekiyor.
          </div>
        )}
        <label className="stack-xs form-field" htmlFor={`${formId}-email`}>
          <span>E-posta *</span>
          <input
            id={`${formId}-email`}
            ref={emailInputRef}
            type="email"
            placeholder="ornek@pasali.com"
            required
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${formId}-error` : undefined}
          />
        </label>
        <label className="stack-xs form-field" htmlFor={`${formId}-password`}>
          <span>Şifre *</span>
          <input
            id={`${formId}-password`}
            type="password"
            placeholder="Şifrenizi girin"
            required
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${formId}-error` : undefined}
          />
        </label>
        <FormMessage id={`${formId}-error`} type="error" message={error} />
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
        <p>
          Hesabınız yok mu?{" "}
          <Link to={registerLink} className="auth-link-subtle">
            Kayıt olun
          </Link>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
