import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import api from "../../api/client";
import DeliveryAddressFields from "../../components/DeliveryAddressFields";
import EmptyState from "../../components/EmptyState";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { PHONE_INPUT_PATTERN, PHONE_INPUT_TITLE, getPhoneValidationMessage, isValidProfilePhone } from "../../utils/accountValidation";
import { getApiErrorMessage, getApiFieldErrors, getApiValidationMessages } from "../../utils/apiErrors";
import {
  buildCheckoutForm,
  createEmptyCheckoutForm,
  getCheckoutValidationState
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
import { resolveUserDeliveryAddress } from "../../../../shared/profile.js";

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
  const formMessageRef = useRef(null);
  const checkoutFormId = useId();
  const siteContent = mergeSiteContent(outletContext?.contactInfo);
  const paymentDetails = siteContent.paymentDetails;
  const [form, setForm] = useState(() => createEmptyCheckoutForm());
  const [checkoutReady, setCheckoutReady] = useState(() => Boolean(user));
  const [error, setError] = useState("");
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [deliveryAddressTouched, setDeliveryAddressTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const deliveryAddressTouchedRef = useRef(deliveryAddressTouched);
  const userRef = useRef(user);
  const orderNotice = getRegionalOrderNotice(
    form.deliveryAddress || resolveUserDeliveryAddress(user),
    subtotal,
    DELIVERY_FEE
  );
  const checkoutValidation = useMemo(() => getCheckoutValidationState(form, user), [form, user]);
  const billingMissingFieldsText = checkoutValidation.missingBillingFields.map((field) => field.label).join(", ");
  const submitBlockedReason = orderNotice.isBlocked
    ? `${orderNotice.warningMessage} ${orderNotice.shortfallMessage}`.trim()
    : !checkoutValidation.isDeliveryAddressComplete
      ? "Teslimat adresi için il, ilçe, mahalle ve açık adres bilgilerini tamamlayın."
      : !checkoutValidation.isBillingAddressComplete
        ? `Fatura bilgilerini tamamlayın: ${billingMissingFieldsText}.`
        : "";

  useEffect(() => {
    deliveryAddressTouchedRef.current = deliveryAddressTouched;
  }, [deliveryAddressTouched]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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

      const nextUser = refreshedUser || userRef.current || null;

      if (nextUser) {
        setForm((current) =>
          buildCheckoutForm(nextUser, current, {
            preserveDeliveryAddress: deliveryAddressTouchedRef.current
          })
        );
      }

      setCheckoutReady(true);
    };

    syncProfileForCheckout();

    return () => {
      isCancelled = true;
    };
  }, [authReady, refreshProfile, user?.id]);

  const validateCheckoutBeforePayment = async () => {
    setError("");
    setFieldErrors({});

    if (orderNotice.isBlocked) {
      setError(`${orderNotice.warningMessage} ${orderNotice.shortfallMessage}`.trim());
      setShowPaymentOptions(false);
      return false;
    }

    if (!checkoutValidation.isDeliveryAddressComplete) {
      setError("Teslimat adresi için il, ilçe, mahalle ve açık adres bilgileri gereklidir.");
      setShowPaymentOptions(false);
      return false;
    }

    if (!checkoutValidation.isBillingAddressComplete) {
      setError(`Fatura bilgilerini tamamlayın: ${billingMissingFieldsText}.`);
      setShowPaymentOptions(false);
      return false;
    }

    if (!isValidProfilePhone(form.invoiceInfo.phone)) {
      setError(getPhoneValidationMessage("Fatura telefonu"));
      setShowPaymentOptions(false);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsPreparingPayment(true);

    const isValidCheckout = await validateCheckoutBeforePayment();

    if (!isValidCheckout) {
      setIsPreparingPayment(false);
      return;
    }

    setShowPaymentOptions(true);
    setIsPreparingPayment(false);
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
    setFieldErrors({});
    setIsSubmittingOrder(true);

    try {
      const { data } = await api.post("/orders", form);
      await refreshCart();
      setShowPaymentOptions(false);
      navigate("/orders", {
        state: {
          successMessage: data?.message || "Sipariş başarıyla oluşturuldu.",
          orderNumber: data?.order?._id ? `#${String(data.order._id).slice(-6).toUpperCase()}` : ""
        }
      });
    } catch (requestError) {
      setFieldErrors(getApiFieldErrors(requestError));
      const validationMessages = getApiValidationMessages(requestError);
      const nextError =
        validationMessages.length > 1
          ? validationMessages.join(" ")
          : getApiErrorMessage(requestError, "Sipariş oluşturulamadı.");
      setError(nextError);
      window.requestAnimationFrame(() => {
        formMessageRef.current?.focus();
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (!cart?.items?.length) {
    return (
      <EmptyState
        title="Ödeme için sepetinizde ürün bulunmalı"
        description="Önce ürün seçip sepetinizi oluşturduktan sonra sipariş adımına geçebilirsiniz."
        actionLabel="Ürünleri İncele"
        actionTo="/products"
      />
    );
  }

  if (!checkoutReady) {
    return <LoadingState message="Teslimat ve fatura bilgileriniz hazırlanıyor..." />;
  }

  const totalAmount = calculateOrderTotal(subtotal, orderNotice.deliveryFee);

  return (
    <section className="checkout-layout">
      <form className="panel stack-md" onSubmit={handleSubmit} aria-describedby={`${checkoutFormId}-messages`}>
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
          idPrefix={`${checkoutFormId}-delivery`}
          required
        />

        <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-notes`}>
          <span>Sipariş notu</span>
          <textarea
            id={`${checkoutFormId}-notes`}
            placeholder="Kapı kodu, teslimat saati gibi ek bilgiler"
            value={form.notes}
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          />
        </label>
        <div className="form-grid">
          <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-invoice-full-name`}>
            <span>Fatura ad soyad *</span>
            <input
              id={`${checkoutFormId}-invoice-full-name`}
              required
              value={form.invoiceInfo.fullName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  invoiceInfo: { ...current.invoiceInfo, fullName: event.target.value }
                }))
              }
              aria-invalid={fieldErrors.fullName ? "true" : "false"}
              aria-describedby={fieldErrors.fullName ? `${checkoutFormId}-invoice-full-name-error` : undefined}
            />
            {fieldErrors.fullName ? (
              <small id={`${checkoutFormId}-invoice-full-name-error`} className="field-error-text">
                {fieldErrors.fullName}
              </small>
            ) : null}
          </label>
          <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-invoice-company-name`}>
            <span>Şirket adı *</span>
            <input
              id={`${checkoutFormId}-invoice-company-name`}
              required
              value={form.invoiceInfo.companyName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  invoiceInfo: { ...current.invoiceInfo, companyName: event.target.value }
                }))
              }
              aria-invalid={fieldErrors.companyName ? "true" : "false"}
              aria-describedby={fieldErrors.companyName ? `${checkoutFormId}-invoice-company-name-error` : undefined}
            />
            {fieldErrors.companyName ? (
              <small id={`${checkoutFormId}-invoice-company-name-error`} className="field-error-text">
                {fieldErrors.companyName}
              </small>
            ) : null}
          </label>
          <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-invoice-tax-number`}>
            <span>Vergi numarası *</span>
            <input
              id={`${checkoutFormId}-invoice-tax-number`}
              required
              value={form.invoiceInfo.taxNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  invoiceInfo: { ...current.invoiceInfo, taxNumber: event.target.value }
                }))
              }
              aria-invalid={fieldErrors.taxNumber ? "true" : "false"}
              aria-describedby={fieldErrors.taxNumber ? `${checkoutFormId}-invoice-tax-number-error` : undefined}
            />
            {fieldErrors.taxNumber ? (
              <small id={`${checkoutFormId}-invoice-tax-number-error`} className="field-error-text">
                {fieldErrors.taxNumber}
              </small>
            ) : null}
          </label>
          <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-invoice-tax-office`}>
            <span>Vergi dairesi *</span>
            <input
              id={`${checkoutFormId}-invoice-tax-office`}
              required
              value={form.invoiceInfo.taxOffice}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  invoiceInfo: { ...current.invoiceInfo, taxOffice: event.target.value }
                }))
              }
              aria-invalid={fieldErrors.taxOffice ? "true" : "false"}
              aria-describedby={fieldErrors.taxOffice ? `${checkoutFormId}-invoice-tax-office-error` : undefined}
            />
            {fieldErrors.taxOffice ? (
              <small id={`${checkoutFormId}-invoice-tax-office-error`} className="field-error-text">
                {fieldErrors.taxOffice}
              </small>
            ) : null}
          </label>
          <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-invoice-email`}>
            <span>Fatura e-postası *</span>
            <input
              id={`${checkoutFormId}-invoice-email`}
              type="email"
              required
              value={form.invoiceInfo.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  invoiceInfo: { ...current.invoiceInfo, email: event.target.value }
                }))
              }
              aria-invalid={fieldErrors.email ? "true" : "false"}
              aria-describedby={fieldErrors.email ? `${checkoutFormId}-invoice-email-error` : undefined}
            />
            {fieldErrors.email ? (
              <small id={`${checkoutFormId}-invoice-email-error`} className="field-error-text">
                {fieldErrors.email}
              </small>
            ) : null}
          </label>
          <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-invoice-phone`}>
            <span>Fatura telefonu *</span>
            <input
              id={`${checkoutFormId}-invoice-phone`}
              required
              value={form.invoiceInfo.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  invoiceInfo: { ...current.invoiceInfo, phone: event.target.value }
                }))
              }
              pattern={PHONE_INPUT_PATTERN}
              title={PHONE_INPUT_TITLE}
              aria-invalid={fieldErrors.phone ? "true" : "false"}
              aria-describedby={fieldErrors.phone ? `${checkoutFormId}-invoice-phone-error` : undefined}
            />
            {fieldErrors.phone ? (
              <small id={`${checkoutFormId}-invoice-phone-error`} className="field-error-text">
                {fieldErrors.phone}
              </small>
            ) : null}
          </label>
        </div>
        <label className="stack-xs form-field" htmlFor={`${checkoutFormId}-invoice-address`}>
          <span>Fatura adresi *</span>
          <textarea
            id={`${checkoutFormId}-invoice-address`}
            required
            value={form.invoiceInfo.billingAddress}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                invoiceInfo: { ...current.invoiceInfo, billingAddress: event.target.value }
              }))
            }
            aria-invalid={fieldErrors.billingAddress ? "true" : "false"}
            aria-describedby={fieldErrors.billingAddress ? `${checkoutFormId}-invoice-address-error` : undefined}
          />
          {fieldErrors.billingAddress ? (
            <small id={`${checkoutFormId}-invoice-address-error`} className="field-error-text">
              {fieldErrors.billingAddress}
            </small>
          ) : null}
        </label>
        <div id={`${checkoutFormId}-messages`} ref={formMessageRef} tabIndex={-1}>
          <FormMessage type="error" message={error} />
        </div>
        {!checkoutValidation.isBillingAddressComplete && (
          <p className="error-text">Fatura için eksik alanlar: {billingMissingFieldsText}.</p>
        )}
        {orderNotice.isBlocked && (
          <div className="stack-sm">
            <p className="error-text">{orderNotice.warningMessage}</p>
            <p>{orderNotice.shortfallMessage}</p>
          </div>
        )}
        {!checkoutValidation.isDeliveryAddressComplete && (
          <p className="error-text">Teslimat adresi için il, ilçe, mahalle ve açık adres bilgileri gereklidir.</p>
        )}
        {submitBlockedReason ? <p className="helper-text">{submitBlockedReason}</p> : null}
        <button type="submit" className="primary-button" disabled={isPreparingPayment || isSubmittingOrder}>
          {isPreparingPayment ? "Ödeme seçenekleri hazırlanıyor..." : "Ödemeyi Tamamla ve Sipariş Ver"}
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
                  aria-pressed={form.paymentMethod === option.id}
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
