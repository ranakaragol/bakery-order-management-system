import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../../api/client";
import DeliveryAddressFields from "../../components/DeliveryAddressFields";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { getApiErrorMessage } from "../../utils/apiErrors";
import {
  buildCheckoutForm,
  createEmptyCheckoutForm
} from "../../utils/deliveryAddressForms";
import { mergeSiteContent } from "../../utils/fallbackContent";
import { getRegionalOrderNotice } from "../../utils/orderMinimums";
import {
  formatCurrency,
  formatDeliveryFee,
  formatLineTotal,
  formatPaymentMethod,
  formatQuantity
} from "../../utils/formatters";
import { DELIVERY_FEE, calculateOrderTotal } from "../../../../shared/commerce.js";
import {
  hasCompleteDeliveryAddress,
  hasCompleteBillingAddress,
  resolveUserDeliveryAddress
} from "../../../../shared/profile.js";

const CheckoutPage = () => {
  const outletContext = useOutletContext();
  const paymentOptions = [
    {
      id: "bank_transfer",
      title: "Havale & EFT",
      description: "Siparişiniz oluşturulur, ödeme onayı sonrası hazırlık sürecine alınır.",
      note: "Havale açıklamasına ad soyad ve sipariş numarasını yazmanız yeterlidir."
    },
    {
      id: "cash_on_delivery",
      title: "Teslimatta Nakit Ödeme",
      description: "Siparişiniz hazırlanır, ödemenizi teslimat sırasında nakit olarak yaparsınız.",
      note: "Teslimat ekibimiz ödemeyi kapıda alır."
    }
  ];

  const navigate = useNavigate();
  const { authReady, user, refreshProfile } = useAuth();
  const { cart, subtotal, refreshCart } = useCart();
  const siteContent = mergeSiteContent(outletContext?.contactInfo);
  const paymentDetails = siteContent.paymentDetails;
  const [form, setForm] = useState(() => createEmptyCheckoutForm());
  const [checkoutReady, setCheckoutReady] = useState(() => Boolean(user));
  const [error, setError] = useState("");
  const [requiresProfileCompletion, setRequiresProfileCompletion] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [deliveryAddressTouched, setDeliveryAddressTouched] = useState(false);
  const orderNotice = getRegionalOrderNotice(
    form.deliveryAddress || resolveUserDeliveryAddress(user),
    subtotal,
    DELIVERY_FEE
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm((current) =>
      buildCheckoutForm(user, current, {
        preserveDeliveryAddress: deliveryAddressTouched
      })
    );
    setCheckoutReady(true);
  }, [deliveryAddressTouched, user]);

  useEffect(() => {
    if (!authReady) {
      return undefined;
    }

    let isCancelled = false;

    const syncProfileForCheckout = async () => {
      const refreshedUser = await refreshProfile();

      if (isCancelled) {
        return;
      }

      const nextUser = refreshedUser || user || null;

      if (nextUser) {
        setForm((current) =>
          buildCheckoutForm(nextUser, current, {
            preserveDeliveryAddress: deliveryAddressTouched
          })
        );
      }

      setCheckoutReady(true);
    };

    syncProfileForCheckout();

    return () => {
      isCancelled = true;
    };
  }, [authReady, user?.id]);

  const validateCheckoutBeforePayment = async () => {
    setError("");
    setRequiresProfileCompletion(false);

    if (orderNotice.isBlocked) {
      setError(`${orderNotice.warningMessage} ${orderNotice.shortfallMessage}`.trim());
      setShowPaymentOptions(false);
      return false;
    }

    const refreshedUser = (await refreshProfile()) || user;

    if (!hasCompleteBillingAddress(refreshedUser?.billingAddress)) {
      setError("Sipariş verebilmek için önce fatura adresinizi tamamlamanız gerekiyor.");
      setRequiresProfileCompletion(true);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValidCheckout = await validateCheckoutBeforePayment();

    if (!isValidCheckout) {
      return;
    }

    setShowPaymentOptions(true);
  };

  const handleConfirmPaymentMethod = async () => {
    if (orderNotice.isBlocked) {
      setError(`${orderNotice.warningMessage} ${orderNotice.shortfallMessage}`.trim());
      setShowPaymentOptions(false);
      return;
    }

    if (!form.paymentMethod) {
      setError("Lütfen bir ödeme yöntemi seçiniz.");
      return;
    }

    setError("");
    setIsSubmittingOrder(true);

    try {
      await api.post("/orders", form);
      await refreshCart();
      setShowPaymentOptions(false);
      navigate("/orders");
    } catch (requestError) {
      const nextError = getApiErrorMessage(requestError, "Sipariş oluşturulamadı.");
      setError(nextError);
      setRequiresProfileCompletion(
        nextError === "Sipariş verebilmek için önce fatura adresinizi tamamlamanız gerekiyor."
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!cart?.items?.length) {
    return <section className="panel">Ödeme için sepetinizde ürün bulunmalı.</section>;
  }

  if (!checkoutReady) {
    return <section className="panel">Kayitli teslimat adresiniz yukleniyor...</section>;
  }

  const totalAmount = calculateOrderTotal(subtotal, orderNotice.deliveryFee);

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

        <DeliveryAddressFields
          value={form.deliveryAddress}
          onChange={(deliveryAddress) => {
            setDeliveryAddressTouched(true);
            setForm((current) => ({ ...current, deliveryAddress }));
          }}
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
            required
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
            required
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
            required
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
            required
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
            required
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
        {error && (
          <div className="stack-sm">
            <p className="error-text">{error}</p>
            {requiresProfileCompletion && (
              <button type="button" className="ghost-button" onClick={() => navigate("/profile")}>
                Profili Tamamla
              </button>
            )}
          </div>
        )}
        {orderNotice.isBlocked && (
          <div className="stack-sm">
            <p className="error-text">{orderNotice.warningMessage}</p>
            <p>{orderNotice.shortfallMessage}</p>
          </div>
        )}
        {!hasCompleteDeliveryAddress(form.deliveryAddress) && (
          <p className="error-text">Teslimat adresi için il, ilçe, mahalle ve açık adres bilgileri gereklidir.</p>
        )}
        <button type="submit" className="primary-button" disabled={orderNotice.isBlocked}>
          Ödemeyi Tamamla ve Sipariş Ver
        </button>

        {showPaymentOptions && (
          <div className="checkout-payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-method-title">
            <div className="checkout-payment-panel">
              <div className="section-heading">
                <span className="eyebrow">Ödeme Seçimi</span>
                <h2 id="payment-method-title">Ödeme yönteminizi seçin</h2>
              </div>

              <div className="payment-option-grid">
                {paymentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`payment-option-card ${
                      form.paymentMethod === option.id ? "payment-option-card--active" : ""
                    }`}
                    onClick={() => setForm((current) => ({ ...current, paymentMethod: option.id }))}
                    disabled={isSubmittingOrder}
                  >
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                    <small>{option.note}</small>
                  </button>
                ))}
              </div>

              {form.paymentMethod === "bank_transfer" && (
                <div className="stack-sm">
                  <div className="info-banner">
                    Seçilen yöntem: <strong>{formatPaymentMethod(form.paymentMethod)}</strong>
                    <br />
                    Siparişiniz havale & EFT ödeme olarak kaydedilecektir.
                  </div>
                  <div className="panel stack-sm">
                    <strong>Havale & EFT Bilgileri</strong>
                    <div className="summary-row">
                      <span>IBAN Ad Soyad / Ünvan</span>
                      <strong>{paymentDetails.accountHolder}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Banka Adı</span>
                      <strong>{paymentDetails.bankName}</strong>
                    </div>
                    <div className="summary-row">
                      <span>IBAN</span>
                      <strong>{paymentDetails.iban}</strong>
                    </div>
                  </div>
                </div>
              )}

              {form.paymentMethod === "cash_on_delivery" && (
                <div className="info-banner">
                  Seçilen yöntem: <strong>{formatPaymentMethod(form.paymentMethod)}</strong>
                  <br />
                  Siparişiniz teslimatta nakit ödeme olarak kaydedilecektir.
                </div>
              )}

              <div className="inline-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleConfirmPaymentMethod}
                  disabled={isSubmittingOrder || orderNotice.isBlocked}
                >
                  {isSubmittingOrder ? "Sipariş oluşturuluyor..." : "Siparişi Tamamla"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setShowPaymentOptions(false)}
                  disabled={isSubmittingOrder}
                >
                  Geri Dön
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      <aside className="summary-card">
        <h2>Ödeme Özeti</h2>
        {cart.items.map((item) => (
          <div key={item._id} className="summary-row">
            <span>
              {item.nameSnapshot} x {formatQuantity(item.quantity, item.unitSnapshot || item.product?.unit)}
            </span>
            <strong>{formatLineTotal(item.unitPrice, item.quantity)}</strong>
          </div>
        ))}
        <div className="summary-row">
          <span>Ara Toplam</span>
          <strong>{formatCurrency(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Teslimat</span>
          <strong>{formatDeliveryFee(orderNotice.deliveryFee)}</strong>
        </div>
        <div className="summary-row">
          <span>Genel Toplam</span>
          <strong>{formatCurrency(totalAmount)}</strong>
        </div>
        {orderNotice.isBlocked && (
          <div className="stack-sm">
            <p className="error-text">{orderNotice.warningMessage}</p>
            <p>{orderNotice.shortfallMessage}</p>
          </div>
        )}
      </aside>
    </section>
  );
};

export default CheckoutPage;
