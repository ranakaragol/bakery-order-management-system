import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatters";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, subtotal, refreshCart } = useCart();
  const [form, setForm] = useState({
    address: "",
    notes: "",
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
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        address: user.address || "",
        notes: "",
        invoiceInfo: {
          fullName: user.invoiceInfo?.fullName || `${user.firstName} ${user.lastName}`,
          companyName: user.invoiceInfo?.companyName || "",
          taxNumber: user.invoiceInfo?.taxNumber || "",
          taxOffice: user.invoiceInfo?.taxOffice || "",
          identityNumber: user.invoiceInfo?.identityNumber || "",
          billingAddress: user.invoiceInfo?.billingAddress || user.address || "",
          phone: user.invoiceInfo?.phone || user.phone || "",
          email: user.invoiceInfo?.email || user.email || ""
        }
      });
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await api.post("/orders", form);
      await refreshCart();
      navigate("/orders");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Sipariş oluşturulamadı.");
    }
  };

  if (!cart?.items?.length) {
    return <section className="panel">Ödeme için sepetinizde ürün bulunmalı.</section>;
  }

  const deliveryFee = subtotal >= 2500 ? 0 : 120;

  return (
    <section className="checkout-layout">
      <form className="panel stack-md" onSubmit={handleSubmit}>
        <div className="section-heading">
          <span className="eyebrow">Ödeme</span>
          <h1>Siparişi tamamla</h1>
        </div>
        <div className="info-banner">
          Fatura bilgileri ilk sipariş aşamasında alınır ve sonraki siparişleriniz için hesabınızda saklanır.
        </div>
        <textarea
          placeholder="Teslimat adresi"
          value={form.address}
          onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
          required
        />
        <textarea
          placeholder="Sipariş notu"
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
        />
        <div className="form-grid">
          <input
            placeholder="Fatura ad soyad"
            required
            value={form.invoiceInfo.fullName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                invoiceInfo: { ...current.invoiceInfo, fullName: event.target.value }
              }))
            }
          />
          <input
            placeholder="Şirket adı"
            value={form.invoiceInfo.companyName}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                invoiceInfo: { ...current.invoiceInfo, companyName: event.target.value }
              }))
            }
          />
          <input
            placeholder="Vergi numarası"
            value={form.invoiceInfo.taxNumber}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                invoiceInfo: { ...current.invoiceInfo, taxNumber: event.target.value }
              }))
            }
          />
          <input
            placeholder="Vergi dairesi"
            value={form.invoiceInfo.taxOffice}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                invoiceInfo: { ...current.invoiceInfo, taxOffice: event.target.value }
              }))
            }
          />
          <input
            placeholder="Fatura e-postası"
            type="email"
            value={form.invoiceInfo.email}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                invoiceInfo: { ...current.invoiceInfo, email: event.target.value }
              }))
            }
          />
          <input
            placeholder="Fatura telefonu"
            value={form.invoiceInfo.phone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                invoiceInfo: { ...current.invoiceInfo, phone: event.target.value }
              }))
            }
          />
        </div>
        <textarea
          placeholder="Fatura adresi"
          required
          value={form.invoiceInfo.billingAddress}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              invoiceInfo: { ...current.invoiceInfo, billingAddress: event.target.value }
            }))
          }
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-button">
          Ödemeyi Tamamla ve Sipariş Ver
        </button>
      </form>

      <aside className="summary-card">
        <h2>Ödeme Özeti</h2>
        {cart.items.map((item) => (
          <div key={item._id} className="summary-row">
            <span>
              {item.nameSnapshot} x {item.quantity}
            </span>
            <strong>{formatCurrency(item.unitPrice * item.quantity)}</strong>
          </div>
        ))}
        <div className="summary-row">
          <span>Ara Toplam</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Teslimat</span>
          <strong>{formatCurrency(deliveryFee)}</strong>
        </div>
        <div className="summary-row">
          <span>Genel Toplam</span>
          <strong>{formatCurrency(subtotal + deliveryFee)}</strong>
        </div>
      </aside>
    </section>
  );
};

export default CheckoutPage;
