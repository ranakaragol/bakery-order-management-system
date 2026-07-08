import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const nextPath = searchParams.get("next");
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

      navigate(nextPath || "/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Giriş yapılamadı.");
    }
  };

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Tek Giriş</span>
        <h1>Hesabınıza veya yönetim paneline girin</h1>
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
          Hesabınız yok mu? <Link to={registerLink}>Kayıt olun</Link>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
