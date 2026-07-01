import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  invoiceInfo: {
    fullName: "",
    companyName: "",
    taxNumber: "",
    taxOffice: "",
    identityNumber: "",
    billingAddress: "",
    phone: "",
    email: ""
  }
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleInvoiceChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      invoiceInfo: {
        ...current.invoiceInfo,
        [name]: value
      }
    }));
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
        address: form.address,
        invoiceInfo: {
          ...form.invoiceInfo,
          email: form.invoiceInfo.email || form.email,
          phone: form.invoiceInfo.phone || form.phone
        }
      });
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Kayit islemi tamamlanamadi.");
    }
  };

  return (
    <section className="auth-shell">
      <form className="auth-card auth-card--wide" onSubmit={handleSubmit}>
        <span className="eyebrow">Yeni Uyelik</span>
        <h1>Musteri hesabi olusturun</h1>
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
        <h2>Fatura Bilgileri</h2>
        <div className="form-grid">
          <input
            name="fullName"
            placeholder="Fatura Unvani / Ad Soyad"
            required
            value={form.invoiceInfo.fullName}
            onChange={handleInvoiceChange}
          />
          <input
            name="companyName"
            placeholder="Sirket Adi"
            value={form.invoiceInfo.companyName}
            onChange={handleInvoiceChange}
          />
          <input
            name="taxNumber"
            placeholder="Vergi Numarasi"
            value={form.invoiceInfo.taxNumber}
            onChange={handleInvoiceChange}
          />
          <input
            name="taxOffice"
            placeholder="Vergi Dairesi"
            value={form.invoiceInfo.taxOffice}
            onChange={handleInvoiceChange}
          />
          <input
            name="identityNumber"
            placeholder="TCKN"
            value={form.invoiceInfo.identityNumber}
            onChange={handleInvoiceChange}
          />
          <input
            name="email"
            type="email"
            placeholder="Fatura E-postasi"
            value={form.invoiceInfo.email}
            onChange={handleInvoiceChange}
          />
        </div>
        <textarea
          name="billingAddress"
          placeholder="Fatura adresi"
          required
          value={form.invoiceInfo.billingAddress}
          onChange={handleInvoiceChange}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading}>
          Hesap Olustur
        </button>
      </form>
    </section>
  );
};

export default RegisterPage;
