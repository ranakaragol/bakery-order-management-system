import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resolveNextPath } from "../../utils/authNavigation";
import { getApiErrorMessage } from "../../utils/apiErrors";

const LoginPage = () => {
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
        <input
          type="email"
          placeholder="E-posta"
          required
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <input
          type="password"
          placeholder="Şifre"
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading}>
          Giriş Yap
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
