import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import {
  canOrderProduct,
  formatCurrency,
  formatDate,
  formatProductPrice,
  hasProductVariants,
  isTrayOnlyProduct
} from "../../utils/formatters";

const buildDefaultVariants = () => [
  { id: "tek", name: "Tek Pasta", price: 125 },
  { id: "0-no", name: "0 No Pasta", price: 420 },
  { id: "1-no", name: "1 No Pasta", price: 550 },
  { id: "2-no", name: "2 No Pasta", price: 650 }
];

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
  image: "",
  category: "",
  unit: "Adet",
  weight: "",
  portion: "",
  shelfLife: "3-4 Gün",
  storageCondition: "+4/+6 Buzdolabı",
  stockStatus: "in_stock",
  stockQuantity: 0,
  featured: false,
  hasVariants: false,
  variants: buildDefaultVariants()
};

const emptyContactForm = {
  heroTitle: "",
  heroDescription: "",
  phone: "",
  email: "",
  address: "",
  mapUrl: "",
  workingHours: "",
  socialLinks: {
    instagram: "",
    facebook: "",
    whatsapp: ""
  }
};

const tabLabels = {
  dashboard: "Genel Bakış",
  orders: "Siparişler",
  products: "Ürünler",
  categories: "Kategoriler",
  customers: "Müşteriler",
  contact: "İletişim"
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
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const selectedCategoryName = categories.find((category) => category._id === productForm.category)?.name || "";
  const shouldShowVariantControls = productForm.hasVariants || selectedCategoryName === "Pastalar";

  const loadAdminData = async () => {
    const [dashboardRes, ordersRes, customersRes, categoriesRes, productsRes, contactRes] = await Promise.all([
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
    setContact(contactRes.data || emptyContactForm);
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productCategoryFilter) {
      return products;
    }

    return products.filter((product) => (product.category?._id || product.category) === productCategoryFilter);
  }, [productCategoryFilter, products]);

  const resetProductForm = () => {
    setProductForm({
      ...emptyProductForm,
      variants: buildDefaultVariants()
    });
    setEditingProductId("");
  };

  const resetCategoryForm = () => {
    setCategoryForm(emptyCategoryForm);
    setEditingCategoryId("");
  };

  const saveCategory = async (event) => {
    event.preventDefault();

    if (editingCategoryId) {
      await api.put(`/categories/${editingCategoryId}`, categoryForm);
      setStatusMessage("Kategori güncellendi.");
    } else {
      await api.post("/categories", categoryForm);
      setStatusMessage("Kategori eklendi.");
    }

    resetCategoryForm();
    await loadAdminData();
  };

  const saveProduct = async (event) => {
    event.preventDefault();

    const payload = {
      ...productForm,
      price: shouldShowVariantControls || productForm.price === "" ? "" : Number(productForm.price),
      variants: shouldShowVariantControls
        ? productForm.variants.map((variant) => ({
            ...variant,
            price: Number(variant.price)
          }))
        : [],
      stockQuantity: Number(productForm.stockQuantity)
    };

    if (editingProductId) {
      await api.put(`/products/${editingProductId}`, payload);
      setStatusMessage("Ürün güncellendi.");
    } else {
      await api.post("/products", payload);
      setStatusMessage("Ürün eklendi.");
    }

    resetProductForm();
    await loadAdminData();
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
      return;
    }

    await api.delete(`/categories/${id}`);
    setStatusMessage("Kategori silindi.");
    await loadAdminData();
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      return;
    }

    await api.delete(`/products/${id}`);
    setStatusMessage("Ürün silindi.");
    await loadAdminData();
  };

  const handleContactSave = async (event) => {
    event.preventDefault();
    await api.put("/admin/contact", contact);
    setStatusMessage("İletişim bilgileri güncellendi.");
    await loadAdminData();
  };

  const handleOrderStatusChange = async (orderId, status) => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
    setStatusMessage("Sipariş durumu güncellendi.");
    await loadAdminData();
  };

  const startEditingProduct = (product) => {
    const variants = hasProductVariants(product)
      ? product.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          price: variant.price
        }))
      : buildDefaultVariants();

    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price ?? "",
      image: product.image || product.imageUrl || "",
      category: product.category?._id || product.category,
      unit: product.unit || "Adet",
      weight: product.weight || "",
      portion: product.portion || "",
      shelfLife: product.shelfLife || "3-4 Gün",
      storageCondition: product.storageCondition || "+4/+6 Buzdolabı",
      stockStatus: product.stockStatus,
      stockQuantity: product.stockQuantity,
      featured: product.featured,
      hasVariants: hasProductVariants(product) || product.category?.name === "Pastalar",
      variants
    });
  };

  const formatVariantSummary = (product) =>
    product.variants.map((variant) => `${variant.name}: ${formatCurrency(variant.price)}`).join(" • ");

  return (
    <section className="admin-shell">
      <div className="page-header">
        <span className="eyebrow">Admin Paneli</span>
        <h1>Paşalı katalog ve operasyon yönetimi</h1>
        <p>Siparişleri, ürün kataloğunu, kategorileri ve iletişim alanlarını tek panelden yönetin.</p>
      </div>

      <div className="admin-tabs">
        {Object.entries(tabLabels).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className={`tab-button ${activeTab === tab ? "tab-button--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {statusMessage && <div className="success-banner">{statusMessage}</div>}

      {activeTab === "dashboard" && dashboard && (
        <div className="stack-lg">
          <div className="metrics-grid">
            <article className="metric-card">
              <span>Toplam Sipariş</span>
              <strong>{dashboard.metrics.orderCount}</strong>
            </article>
            <article className="metric-card">
              <span>Ürün Sayısı</span>
              <strong>{dashboard.metrics.productCount}</strong>
            </article>
            <article className="metric-card">
              <span>Kategori Sayısı</span>
              <strong>{dashboard.metrics.categoryCount}</strong>
            </article>
            <article className="metric-card">
              <span>Müşteri Sayısı</span>
              <strong>{dashboard.metrics.customerCount}</strong>
            </article>
          </div>

          <div className="panel">
            <h2>Son Siparişler</h2>
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
                <option value="Hazirlaniyor">Hazırlanıyor</option>
                <option value="Teslimata Cikti">Teslimata Çıktı</option>
                <option value="Tamamlandi">Tamamlandı</option>
                <option value="Iptal Edildi">İptal Edildi</option>
              </select>
            </article>
          ))}
        </div>
      )}

      {activeTab === "products" && (
        <div className="admin-grid">
          <form className="panel stack-sm" onSubmit={saveProduct}>
            <h2>{editingProductId ? "Ürünü Güncelle" : "Yeni Ürün"}</h2>
            <input
              placeholder="Ürün adı"
              value={productForm.name}
              onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <textarea
              placeholder="Açıklama"
              value={productForm.description}
              onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            {selectedCategoryName === "Pastalar" ? (
              <div className="helper-text helper-text--panel">
                Pastalar kategorisindeki ürünlerde Tek / 0 No / 1 No / 2 No seçenekleri kullanılır.
              </div>
            ) : (
              <label className="checkbox-row checkbox-row--inline">
                <input
                  type="checkbox"
                  checked={productForm.hasVariants}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      hasVariants: event.target.checked,
                      price: event.target.checked ? "" : current.price,
                      variants: buildDefaultVariants()
                    }))
                  }
                />
                Bu ürün varyantlı olarak satılır
              </label>
            )}
            <div className="form-grid">
              {shouldShowVariantControls ? (
                <div className="helper-text helper-text--panel">Bu ürün için fiyatlar varyant alanlarından yönetilir.</div>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Fiyat (boş ise Fiyat sorunuz)"
                  value={productForm.price}
                  onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                />
              )}
              <select
                value={productForm.unit}
                onChange={(event) => setProductForm((current) => ({ ...current, unit: event.target.value }))}
                required
              >
                <option value="Adet">Adet</option>
                <option value="Kg">Kg</option>
                <option value="Tepsi">Tepsi</option>
              </select>
            </div>
            {shouldShowVariantControls && (
              <div className="stack-sm">
                <strong>Varyant Fiyatları</strong>
                <div className="form-grid">
                  {productForm.variants.map((variant, index) => (
                    <input
                      key={variant.id}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={`${variant.name} fiyatı`}
                      value={variant.price}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          variants: current.variants.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, price: event.target.value } : item
                          )
                        }))
                      }
                      required
                    />
                  ))}
                </div>
              </div>
            )}
            <input
              placeholder="Ürün görseli yolu veya URL"
              value={productForm.image}
              onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
              required
            />
            {productForm.image && <img src={productForm.image} alt="Ürün önizleme" className="admin-image-preview" />}
            <select
              value={productForm.category}
              onChange={(event) => {
                const nextCategoryId = event.target.value;
                const nextCategory = categories.find((category) => category._id === nextCategoryId);

                setProductForm((current) => ({
                  ...current,
                  category: nextCategoryId,
                  hasVariants: nextCategory?.name === "Pastalar" ? true : current.hasVariants
                }));
              }}
              required
            >
              <option value="">Kategori seçin</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="form-grid">
              <input
                placeholder="Gramaj"
                value={productForm.weight}
                onChange={(event) => setProductForm((current) => ({ ...current, weight: event.target.value }))}
              />
              <input
                placeholder="Porsiyon"
                value={productForm.portion}
                onChange={(event) => setProductForm((current) => ({ ...current, portion: event.target.value }))}
              />
            </div>
            <div className="form-grid">
              <input
                placeholder="Raf ömrü"
                value={productForm.shelfLife}
                onChange={(event) => setProductForm((current) => ({ ...current, shelfLife: event.target.value }))}
                required
              />
              <input
                placeholder="Saklama koşulu"
                value={productForm.storageCondition}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, storageCondition: event.target.value }))
                }
                required
              />
            </div>
            <div className="form-grid">
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
              <select
                value={productForm.stockStatus}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, stockStatus: event.target.value }))
                }
              >
                <option value="in_stock">Stokta</option>
                <option value="limited">Sınırlı</option>
                <option value="out_of_stock">Tükendi</option>
              </select>
            </div>
            <label className="checkbox-row checkbox-row--inline">
              <input
                type="checkbox"
                checked={productForm.featured}
                onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))}
              />
              Öne çıkan ürün
            </label>
            <div className="inline-actions">
              <button type="submit" className="primary-button">
                Kaydet
              </button>
              {editingProductId && (
                <button type="button" className="ghost-button" onClick={resetProductForm}>
                  İptal
                </button>
              )}
            </div>
          </form>

          <div className="stack-sm">
            <div className="panel stack-sm">
              <div className="summary-row">
                <strong>Ürün Listesi</strong>
                <span>{filteredProducts.length} kayıt</span>
              </div>
              <select value={productCategoryFilter} onChange={(event) => setProductCategoryFilter(event.target.value)}>
                <option value="">Tüm kategoriler</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredProducts.map((product) => (
              <article key={product._id} className="panel">
                <div className="summary-row">
                  <strong>{product.name}</strong>
                  <span>{formatProductPrice(product)}</span>
                </div>
                <p>{product.category?.name}</p>
                {hasProductVariants(product) && <p className="helper-text">{formatVariantSummary(product)}</p>}
                <div className="admin-product-meta">
                  <span>{product.unit}</span>
                  <span>{product.weight || "Gramaj yok"}</span>
                  <span>{product.portion || "Porsiyon yok"}</span>
                  <span>{product.shelfLife}</span>
                </div>
                <p>Saklama: {product.storageCondition}</p>
                {isTrayOnlyProduct(product) && <p className="helper-text">Tekli satış bulunmamaktadır.</p>}
                {!canOrderProduct(product) && <p className="helper-text">Bu ürün fiyat teyidi ile listelenir.</p>}
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => startEditingProduct(product)}>
                    Düzenle
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
            <h2>{editingCategoryId ? "Kategori Güncelle" : "Yeni Kategori"}</h2>
            <input
              placeholder="Kategori adı"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <textarea
              placeholder="Açıklama"
              value={categoryForm.description}
              onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
              required
            />
            <input
              placeholder="Görsel yolu veya URL"
              value={categoryForm.imageUrl}
              onChange={(event) => setCategoryForm((current) => ({ ...current, imageUrl: event.target.value }))}
              required
            />
            {categoryForm.imageUrl && (
              <img src={categoryForm.imageUrl} alt="Kategori önizleme" className="admin-image-preview" />
            )}
            <label className="checkbox-row checkbox-row--inline">
              <input
                type="checkbox"
                checked={categoryForm.isFeatured}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, isFeatured: event.target.checked }))
                }
              />
              Öne çıkan kategori
            </label>
            <div className="inline-actions">
              <button type="submit" className="primary-button">
                Kaydet
              </button>
              {editingCategoryId && (
                <button type="button" className="ghost-button" onClick={resetCategoryForm}>
                  İptal
                </button>
              )}
            </div>
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
                    Düzenle
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
          <h2>Ana Sayfa İletişim Bilgileri</h2>
          <input
            placeholder="Hero başlık"
            value={contact.heroTitle || ""}
            onChange={(event) => setContact((current) => ({ ...current, heroTitle: event.target.value }))}
            required
          />
          <textarea
            placeholder="Hero açıklama"
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
            placeholder="Google Maps bağlantısı"
            value={contact.mapUrl || ""}
            onChange={(event) => setContact((current) => ({ ...current, mapUrl: event.target.value }))}
          />
          <input
            placeholder="Çalışma saatleri"
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
            İletişim Bilgilerini Kaydet
          </button>
        </form>
      )}
    </section>
  );
};

export default AdminDashboardPage;
