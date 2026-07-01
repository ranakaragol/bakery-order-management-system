import { useEffect, useState } from "react";
import api from "../../api/client";
import { formatCurrency, formatDate } from "../../utils/formatters";

const emptyCategoryForm = {
  name: "",
  description: "",
  imageUrl: "",
  isFeatured: false
};

const emptyProductForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "",
  stockStatus: "in_stock",
  stockQuantity: 0,
  featured: false
};

const emptyContactForm = {
  heroTitle: "",
  heroDescription: "",
  phone: "",
  email: "",
  address: "",
  workingHours: "",
  socialLinks: {
    instagram: "",
    facebook: "",
    whatsapp: ""
  }
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [contact, setContact] = useState(emptyContactForm);
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const loadAdminData = async () => {
    const [dashboardRes, ordersRes, customersRes, categoriesRes, productsRes, contactRes] =
      await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/orders"),
        api.get("/admin/customers"),
        api.get("/categories"),
        api.get("/products"),
        api.get("/admin/contact")
      ]);

    setDashboard(dashboardRes.data);
    setOrders(ordersRes.data);
    setCustomers(customersRes.data);
    setCategories(categoriesRes.data);
    setProducts(productsRes.data);
    setContact(contactRes.data);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const saveCategory = async (event) => {
    event.preventDefault();

    if (editingCategoryId) {
      await api.put(`/categories/${editingCategoryId}`, categoryForm);
      setStatusMessage("Kategori guncellendi.");
    } else {
      await api.post("/categories", categoryForm);
      setStatusMessage("Kategori eklendi.");
    }

    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId("");
    loadAdminData();
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const payload = {
      ...productForm,
      price: Number(productForm.price),
      stockQuantity: Number(productForm.stockQuantity)
    };

    if (editingProductId) {
      await api.put(`/products/${editingProductId}`, payload);
      setStatusMessage("Urun guncellendi.");
    } else {
      await api.post("/products", payload);
      setStatusMessage("Urun eklendi.");
    }

    setProductForm(emptyProductForm);
    setEditingProductId("");
    loadAdminData();
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Bu kategoriyi silmek istediginize emin misiniz?")) {
      return;
    }

    await api.delete(`/categories/${id}`);
    setStatusMessage("Kategori silindi.");
    loadAdminData();
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bu urunu silmek istediginize emin misiniz?")) {
      return;
    }

    await api.delete(`/products/${id}`);
    setStatusMessage("Urun silindi.");
    loadAdminData();
  };

  const handleContactSave = async (event) => {
    event.preventDefault();
    await api.put("/admin/contact", contact);
    setStatusMessage("Iletisim bilgileri guncellendi.");
    loadAdminData();
  };

  const handleOrderStatusChange = async (orderId, status) => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
    setStatusMessage("Siparis durumu guncellendi.");
    loadAdminData();
  };

  return (
    <section className="admin-shell">
      <div className="page-header">
        <span className="eyebrow">Admin Paneli</span>
        <h1>Operasyon yonetimi</h1>
        <p>Siparisler, urunler, kategoriler, musteriler ve ana sayfa iletisim bilgilerini yonetin.</p>
      </div>

      <div className="admin-tabs">
        {["dashboard", "orders", "products", "categories", "customers", "contact"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-button ${activeTab === tab ? "tab-button--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {statusMessage && <div className="success-banner">{statusMessage}</div>}

      {activeTab === "dashboard" && dashboard && (
        <div className="stack-lg">
          <div className="metrics-grid">
            <article className="metric-card">
              <span>Toplam Siparis</span>
              <strong>{dashboard.metrics.orderCount}</strong>
            </article>
            <article className="metric-card">
              <span>Urun Sayisi</span>
              <strong>{dashboard.metrics.productCount}</strong>
            </article>
            <article className="metric-card">
              <span>Kategori Sayisi</span>
              <strong>{dashboard.metrics.categoryCount}</strong>
            </article>
            <article className="metric-card">
              <span>Musteri Sayisi</span>
              <strong>{dashboard.metrics.customerCount}</strong>
            </article>
          </div>

          <div className="panel">
            <h2>Son Siparisler</h2>
            <div className="stack-sm">
              {dashboard.recentOrders.map((order) => (
                <div key={order._id} className="summary-row">
                  <span>
                    {order.user?.firstName} {order.user?.lastName}
                  </span>
                  <strong>{formatDate(order.createdAt)}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="stack-md">
          {orders.map((order) => (
            <article key={order._id} className="panel">
              <div className="summary-row">
                <strong>
                  {order.user?.firstName} {order.user?.lastName}
                </strong>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <p>{order.user?.email}</p>
              <p>Toplam: {formatCurrency(order.totalAmount)}</p>
              <p>Adres: {order.addressSnapshot}</p>
              <select value={order.status} onChange={(event) => handleOrderStatusChange(order._id, event.target.value)}>
                <option value="Hazirlaniyor">Hazirlaniyor</option>
                <option value="Teslimata Cikti">Teslimata Cikti</option>
                <option value="Tamamlandi">Tamamlandi</option>
                <option value="Iptal Edildi">Iptal Edildi</option>
              </select>
            </article>
          ))}
        </div>
      )}

      {activeTab === "products" && (
        <div className="admin-grid">
          <form className="panel stack-sm" onSubmit={saveProduct}>
            <h2>{editingProductId ? "Urunu Guncelle" : "Yeni Urun"}</h2>
            <input
              placeholder="Urun adi"
              value={productForm.name}
              onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <textarea
              placeholder="Aciklama"
              value={productForm.description}
              onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            <div className="form-grid">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Fiyat"
                value={productForm.price}
                onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                required
              />
              <input
                type="number"
                min="0"
                placeholder="Stok"
                value={productForm.stockQuantity}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, stockQuantity: event.target.value }))
                }
                required
              />
            </div>
            <input
              placeholder="Gorsel URL"
              value={productForm.imageUrl}
              onChange={(event) => setProductForm((current) => ({ ...current, imageUrl: event.target.value }))}
              required
            />
            <select
              value={productForm.category}
              onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
              required
            >
              <option value="">Kategori secin</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="form-grid">
              <select
                value={productForm.stockStatus}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, stockStatus: event.target.value }))
                }
              >
                <option value="in_stock">Stokta</option>
                <option value="limited">Sinirli</option>
                <option value="out_of_stock">Tukendi</option>
              </select>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={productForm.featured}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, featured: event.target.checked }))
                  }
                />
                One cikan urun
              </label>
            </div>
            <button type="submit" className="primary-button">
              Kaydet
            </button>
          </form>

          <div className="stack-sm">
            {products.map((product) => (
              <article key={product._id} className="panel">
                <div className="summary-row">
                  <strong>{product.name}</strong>
                  <span>{formatCurrency(product.price)}</span>
                </div>
                <p>{product.category?.name}</p>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      setEditingProductId(product._id);
                      setProductForm({
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        category: product.category?._id || product.category,
                        stockStatus: product.stockStatus,
                        stockQuantity: product.stockQuantity,
                        featured: product.featured
                      });
                    }}
                  >
                    Duzenle
                  </button>
                  <button type="button" className="text-button" onClick={() => handleDeleteProduct(product._id)}>
                    Sil
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === "categories" && (
        <div className="admin-grid">
          <form className="panel stack-sm" onSubmit={saveCategory}>
            <h2>{editingCategoryId ? "Kategori Guncelle" : "Yeni Kategori"}</h2>
            <input
              placeholder="Kategori adi"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <textarea
              placeholder="Aciklama"
              value={categoryForm.description}
              onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            <input
              placeholder="Gorsel URL"
              value={categoryForm.imageUrl}
              onChange={(event) => setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))}
              required
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={categoryForm.isFeatured}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, isFeatured: event.target.checked }))
                }
              />
              One cikan kategori
            </label>
            <button type="submit" className="primary-button">
              Kaydet
            </button>
          </form>

          <div className="stack-sm">
            {categories.map((category) => (
              <article key={category._id} className="panel">
                <strong>{category.name}</strong>
                <p>{category.description}</p>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      setEditingCategoryId(category._id);
                      setCategoryForm({
                        name: category.name,
                        description: category.description,
                        imageUrl: category.imageUrl,
                        isFeatured: category.isFeatured
                      });
                    }}
                  >
                    Duzenle
                  </button>
                  <button type="button" className="text-button" onClick={() => handleDeleteCategory(category._id)}>
                    Sil
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === "customers" && (
        <div className="stack-sm">
          {customers.map((customer) => (
            <article key={customer.id} className="panel">
              <strong>
                {customer.firstName} {customer.lastName}
              </strong>
              <p>{customer.email}</p>
              <p>{customer.phone}</p>
              <p>{customer.address}</p>
              <p>Fatura: {customer.invoiceInfo?.fullName || "Bilgi yok"}</p>
            </article>
          ))}
        </div>
      )}

      {activeTab === "contact" && (
        <form className="panel stack-sm" onSubmit={handleContactSave}>
          <h2>Ana Sayfa Iletisim Bilgileri</h2>
          <input
            placeholder="Hero baslik"
            value={contact.heroTitle || ""}
            onChange={(event) => setContact((current) => ({ ...current, heroTitle: event.target.value }))}
            required
          />
          <textarea
            placeholder="Hero aciklama"
            value={contact.heroDescription || ""}
            onChange={(event) => setContact((current) => ({ ...current, heroDescription: event.target.value }))}
            required
          />
          <div className="form-grid">
            <input
              placeholder="Telefon"
              value={contact.phone || ""}
              onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))}
              required
            />
            <input
              placeholder="E-posta"
              value={contact.email || ""}
              onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </div>
          <textarea
            placeholder="Adres"
            value={contact.address || ""}
            onChange={(event) => setContact((current) => ({ ...current, address: event.target.value }))}
            required
          />
          <input
            placeholder="Calisma saatleri"
            value={contact.workingHours || ""}
            onChange={(event) => setContact((current) => ({ ...current, workingHours: event.target.value }))}
            required
          />
          <div className="form-grid">
            <input
              placeholder="Instagram"
              value={contact.socialLinks?.instagram || ""}
              onChange={(event) =>
                setContact((current) => ({
                  ...current,
                  socialLinks: { ...current.socialLinks, instagram: event.target.value }
                }))
              }
            />
            <input
              placeholder="Facebook"
              value={contact.socialLinks?.facebook || ""}
              onChange={(event) =>
                setContact((current) => ({
                  ...current,
                  socialLinks: { ...current.socialLinks, facebook: event.target.value }
                }))
              }
            />
            <input
              placeholder="WhatsApp"
              value={contact.socialLinks?.whatsapp || ""}
              onChange={(event) =>
                setContact((current) => ({
                  ...current,
                  socialLinks: { ...current.socialLinks, whatsapp: event.target.value }
                }))
              }
            />
          </div>
          <button type="submit" className="primary-button">
            Iletisim Bilgilerini Kaydet
          </button>
        </form>
      )}
    </section>
  );
};

export default AdminDashboardPage;
