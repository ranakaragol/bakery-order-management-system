import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/client";
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
  const outletContext = useOutletContext();
  const paymentDetails = mergeSiteContent(outletContext?.contactInfo).paymentDetails;
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/my").then(({ data }) => setOrders(data));
  }, []);

  return (
    <section className="stack-lg">
      <div className="page-header">
        <span className="eyebrow">Siparişlerim</span>
        <h1>Geçmiş sipariş takibi</h1>
      </div>

      <div className="stack-md">
        {orders.map((order) => (
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
        ))}
      </div>
    </section>
  );
};

export default OrdersPage;
