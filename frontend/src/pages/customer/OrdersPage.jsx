import { useCallback, useEffect, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import { mergeSiteContent } from "../../utils/fallbackContent";
import {
  formatCurrency,
  formatDate,
  formatDeliveryFee,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  formatQuantity
} from "../../utils/formatters";

const OrdersPage = () => {
  const location = useLocation();
  const outletContext = useOutletContext();
  const paymentDetails = mergeSiteContent(outletContext?.contactInfo).paymentDetails;
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const successMessage =
    location.state?.successMessage && location.state?.orderNumber
      ? `${location.state.successMessage} Sipariş numaranız: ${location.state.orderNumber}.`
      : location.state?.successMessage || "";

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data } = await api.get("/orders/my");
      setOrders(data);
    } catch {
      setErrorMessage("Siparişleriniz şu anda yüklenemiyor. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  if (isLoading) {
    return <LoadingState message="Siparişleriniz yükleniyor..." />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={loadOrders} />;
  }

  return (
    <section className="stack-lg">
      <div className="page-header">
        <span className="eyebrow">Siparişlerim</span>
        <h1>Geçmiş sipariş takibi</h1>
      </div>

      <FormMessage type="success" message={successMessage} />

      <div className="stack-md">
        {orders.length ? (
          orders.map((order) => (
            <article key={order._id} className="panel">
              <div className="summary-row">
                <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <div className="summary-row">
                <span>Durum</span>
                <strong>{formatOrderStatus(order.status)}</strong>
              </div>
              <div className="summary-row">
                <span>Toplam</span>
                <strong>{formatCurrency(order.totalAmount)}</strong>
              </div>
              <div className="summary-row">
                <span>Ödeme Yöntemi</span>
                <strong>{formatPaymentMethod(order.paymentMethod)}</strong>
              </div>
              <div className="summary-row">
                <span>Ödeme Durumu</span>
                <strong>{formatPaymentStatus(order.paymentStatus)}</strong>
              </div>
              {order.paymentMethod === "bank_transfer" && (
                <div className="stack-sm">
                  <div className="info-banner">
                    Havale siparişiniz için ödeme bilgileri aşağıdadır.
                  </div>
                  <div className="detail-specs">
                    <div className="detail-spec">
                      <span>IBAN Ad Soyad</span>
                      <strong>{paymentDetails.accountHolder}</strong>
                    </div>
                    <div className="detail-spec">
                      <span>Banka Adı</span>
                      <strong>{paymentDetails.bankName}</strong>
                    </div>
                    <div className="detail-spec">
                      <span>IBAN</span>
                      <strong>{paymentDetails.iban}</strong>
                    </div>
                  </div>
                </div>
              )}
              <div className="summary-row">
                <span>Teslimat</span>
                <strong>{formatDeliveryFee(order.deliveryFee)}</strong>
              </div>
              <ul className="plain-list">
                {order.items.map((item) => (
                  <li key={`${order._id}-${item.name}`}>
                    {item.name} x {formatQuantity(item.quantity, item.unit)}
                  </li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <EmptyState
            title="Henüz siparişiniz bulunmuyor"
            description="İlk siparişinizi oluşturmak için ürün kataloğuna göz atabilirsiniz."
            actionLabel="Ürünleri İncele"
            actionTo="/products"
          />
        )}
      </div>
    </section>
  );
};

export default OrdersPage;
