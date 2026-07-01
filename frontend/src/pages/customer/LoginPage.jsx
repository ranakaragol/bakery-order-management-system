import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const { user } = await login(form);
      navigate(user.role === "admin" ? "/admin/dashboard" : "/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Giris yapilamadi.");
    }
  };

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Musteri Girisi</span>
        <h1>Hesabiniza girin</h1>
        <input
          type="email"
          placeholder="E-posta"
          required
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <input
          type="password"
          placeholder="Sifre"
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading}>
          Giris Yap
        </button>
        <p>
          Hesabiniz yok mu? <Link to="/register">Kayit olun</Link>
        </p>
        <p>
          Yonetici misiniz? <Link to="/admin/login">Admin girisine gidin</Link>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
