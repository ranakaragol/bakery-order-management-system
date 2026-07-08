import { useEffect, useState } from "react";
import api from "../../api/client";
import { formatCurrency, formatDate, formatOrderStatus } from "../../utils/formatters";

const OrdersPage = () => {
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
            <ul className="plain-list">
              {order.items.map((item) => (
                <li key={`${order._id}-${item.name}`}>
                  {item.name} x {item.quantity}
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
