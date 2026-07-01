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
      setError("Sifreler eslesmiyor.");
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
      setError(requestError.response?.data?.message || "Kayit islemi tamamlanamadi.");
    }
  };

  return (
    <section className="auth-shell">
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <span className="eyebrow">Yeni Uyelik</span>
        <h1>Musteri hesabi olusturun</h1>
        <div className="info-banner">
          Fatura bilgileri bu asamada alinmiyor. Ilk siparisinizi olustururken gerekli alanlari doldurabilirsiniz.
        </div>
        {intent === "cart" && (
          <div className="helper-text helper-text--panel">
            Hesabinizi olusturduktan sonra urun detayina donup sepete eklemeye devam edebilirsiniz.
          </div>
        )}
        <div className="form-grid">
          <input name="firstName" placeholder="Ad" required value={form.firstName} onChange={handleChange} />
          <input name="lastName" placeholder="Soyad" required value={form.lastName} onChange={handleChange} />
          <input name="email" type="email" placeholder="E-posta" required value={form.email} onChange={handleChange} />
          <input name="phone" placeholder="GSM Numarasi" required value={form.phone} onChange={handleChange} />
          <input
            name="password"
            type="password"
            placeholder="Sifre"
            required
            value={form.password}
            onChange={handleChange}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Sifre Tekrari"
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
          Hesap Olustur
        </button>
        <p>
          Zaten hesabiniz var mi? <Link to={loginLink}>Giris yapin</Link>
        </p>
      </form>
    </section>
  );
};

export default RegisterPage;
