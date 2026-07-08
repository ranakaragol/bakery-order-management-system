import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: ""
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const nextPath = searchParams.get("next");
  const intent = searchParams.get("intent");
  const loginLink = `/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
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
        address: form.address
      });
      navigate(nextPath || "/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Kayıt işlemi tamamlanamadı.");
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
          <input name="firstName" placeholder="Ad" required value={form.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Soyad" required value={form.lastName} onChange={handleChange} />
          <input name="email" type="email" placeholder="E-posta" required value={form.email} onChange={handleChange} />
          <input name="phone" placeholder="GSM Numarası" required value={form.phone} onChange={handleChange} />
          <input
            name="password"
            type="password"
            placeholder="Şifre"
            required
            value={form.password}
            onChange={handleChange}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Şifre Tekrarı"
            required
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>
        <textarea
          name="address"
          placeholder="Teslimat adresi"
          required
          value={form.address}
          onChange={handleChange}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading}>
          Hesap Oluştur
        </button>
        <p>
          Zaten hesabınız var mı? <Link to={loginLink}>Giriş yapın</Link>
        </p>
      </form>
    </section>
  );
};

export default RegisterPage;
