import { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import FormMessage from "../../components/FormMessage";
import LoadingState from "../../components/LoadingState";
import { getApiErrorMessage } from "../../utils/apiErrors";
import {
  buildCategoryPayload,
  createCategoryFormFromCategory,
  createEmptyCategoryForm,
  getCategoryManagementState,
  getCategoryOptionLabel,
  getCategoryProductCount,
  removeCategoryFromList,
  sortAdminCategories,
  upsertCategoryList,
  validateCategoryForm
} from "../../utils/adminCategoryForm";
import {
  applyCategoryConfigToForm,
  buildProductPayload,
  createEmptyProductForm,
  createProductFormFromProduct,
  filterProductsByCategory,
  filterProductsBySearch,
  getCategoryProductConfig,
  validateProductForm
} from "../../utils/adminProductForm";
import {
  formatCurrency,
  formatDate,
  formatDeliveryFee,
  formatPaymentMethod,
  formatPaymentStatus,
  formatQuantity,
  formatProductPrice,
  hasProductVariants,
  stockLabels
} from "../../utils/formatters";

const tabLabels = {
  dashboard: "Genel Bakış",
  orders: "Siparişler",
  categories: "Kategori Yönetimi",
  products: "Ürünler",
  customers: "Müşteriler"
};

const productModeLabels = {
  create: "Yeni Ürün Ekle",
  edit: "Ürün Güncelle"
};

const customerFilterLabels = {
  all: "Tüm alanlar",
  fullName: "Ad Soyad",
  email: "E-posta",
  phone: "Telefon",
  address: "Adres",
  invoice: "Fatura",
  createdAt: "Kayıt Tarihi"
};

const initialSectionLoading = {
  dashboard: true,
  orders: true,
  customers: true,
  categories: true,
  products: true
};

const emptySectionErrors = {
  dashboard: "",
  orders: "",
  customers: "",
  categories: "",
  products: ""
};

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sectionLoading, setSectionLoading] = useState(initialSectionLoading);
  const [sectionErrors, setSectionErrors] = useState(emptySectionErrors);
  const [productForm, setProductForm] = useState(() => createEmptyProductForm());
  const [categoryCreateForm, setCategoryCreateForm] = useState(() => createEmptyCategoryForm());
  const [categoryEditForm, setCategoryEditForm] = useState(() => createEmptyCategoryForm());
  const [productMode, setProductMode] = useState("create");
  const [createCategoryId, setCreateCategoryId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editManagedCategoryId, setEditManagedCategoryId] = useState("");
  const [selectedEditProductId, setSelectedEditProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [productError, setProductError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [customerSearchField, setCustomerSearchField] = useState("all");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const productsSectionError = [sectionErrors.categories, sectionErrors.products].filter(Boolean).join(" ");
  const createCategory = categories.find((category) => category._id === createCategoryId) || null;
  const editCategory = categories.find((category) => category._id === editCategoryId) || null;
  const managedCategory = categories.find((category) => category._id === editManagedCategoryId) || null;
  const selectedProductCategory =
    categories.find((category) => category._id === productForm.category) ||
    (productMode === "create" ? createCategory : editCategory);
  const activeProductConfig = getCategoryProductConfig(selectedProductCategory);
  const previewImage = String(productForm.image || "").trim() || selectedProductCategory?.imageUrl || "";
  const categoryManagementState = getCategoryManagementState({
    categories,
    isLoading: sectionLoading.categories,
    error: sectionErrors.categories,
    selectedCategoryId: editManagedCategoryId
  });

  const loadAdminData = async () => {
    setSectionLoading(initialSectionLoading);
    setSectionErrors(emptySectionErrors);

    const [dashboardRes, ordersRes, customersRes, categoriesRes, productsRes] = await Promise.allSettled([
      api.get("/admin/dashboard"),
      api.get("/admin/orders"),
      api.get("/admin/customers"),
      api.get("/categories/admin"),
      api.get("/products/admin")
    ]);

    if (dashboardRes.status === "fulfilled") {
      setDashboard(dashboardRes.value.data);
    } else {
      setSectionErrors((current) => ({
        ...current,
        dashboard: getApiErrorMessage(dashboardRes.reason, "Genel bakış verileri yüklenemedi.")
      }));
    }

    if (ordersRes.status === "fulfilled") {
      setOrders(ordersRes.value.data);
    } else {
      setSectionErrors((current) => ({
        ...current,
        orders: getApiErrorMessage(ordersRes.reason, "Sipariş verileri yüklenemedi.")
      }));
    }

    if (customersRes.status === "fulfilled") {
      setCustomers(customersRes.value.data);
    } else {
      setSectionErrors((current) => ({
        ...current,
        customers: getApiErrorMessage(customersRes.reason, "Müşteri verileri yüklenemedi.")
      }));
    }

    if (categoriesRes.status === "fulfilled") {
      setCategories(sortAdminCategories(categoriesRes.value.data));
    } else {
      setSectionErrors((current) => ({
        ...current,
        categories: getApiErrorMessage(categoriesRes.reason, "Kategori verileri yüklenemedi.")
      }));
    }

    if (productsRes.status === "fulfilled") {
      setProducts(productsRes.value.data);
    } else {
      setSectionErrors((current) => ({
        ...current,
        products: getApiErrorMessage(productsRes.reason, "Ürün verileri yüklenemedi.")
      }));
    }

    setSectionLoading({
      dashboard: false,
      orders: false,
      customers: false,
      categories: false,
      products: false
    });
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const productsInSelectedCategory = useMemo(
    () => filterProductsByCategory(products, editCategoryId),
    [editCategoryId, products]
  );

  const filteredProductsInSelectedCategory = useMemo(
    () => filterProductsBySearch(productsInSelectedCategory, productSearch),
    [productSearch, productsInSelectedCategory]
  );

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = customerSearchTerm.trim().toLocaleLowerCase("tr-TR");

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      const searchableFields = {
        fullName: `${customer.firstName || ""} ${customer.lastName || ""}`.trim(),
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        invoice: customer.invoiceInfo?.fullName || "",
        createdAt: customer.createdAt ? formatDate(customer.createdAt) : ""
      };

      if (customerSearchField === "all") {
        return Object.values(searchableFields).some((value) =>
          String(value).toLocaleLowerCase("tr-TR").includes(normalizedSearch)
        );
      }

      return String(searchableFields[customerSearchField] || "")
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedSearch);
    });
  }, [customerSearchField, customerSearchTerm, customers]);

  const resetProductFlow = (nextMode = productMode) => {
    setProductError("");
    setProductSearch("");
    setSelectedEditProductId("");

    if (nextMode === "create") {
      setEditCategoryId("");
      setCreateCategoryId("");
    } else {
      setCreateCategoryId("");
      setEditCategoryId("");
    }

    setProductForm(createEmptyProductForm());
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const validationMessage = validateProductForm(productForm, selectedProductCategory);

    if (validationMessage) {
      setProductError(validationMessage);
      return;
    }

    setIsSavingProduct(true);
    setProductError("");

    try {
      const payload = buildProductPayload(productForm, selectedProductCategory);

      if (productMode === "edit" && selectedEditProductId) {
        const { data } = await api.put(`/products/${selectedEditProductId}`, payload);
        const updatedProduct = data.product;
        const updatedCategoryId = updatedProduct.category?._id || updatedProduct.category || payload.category;

        setStatusMessage(`${updatedProduct.name} ürünü güncellendi.`);
        setEditCategoryId(updatedCategoryId);
        setSelectedEditProductId(updatedProduct._id);
        setProductForm(
          createProductFormFromProduct(
            updatedProduct,
            categories.find((category) => category._id === updatedCategoryId) || selectedProductCategory
          )
        );
        await loadAdminData();
      } else {
        await api.post("/products", payload);
        setStatusMessage(`${payload.name} ürünü oluşturuldu.`);
        await loadAdminData();
        setCreateCategoryId("");
        setProductForm(createEmptyProductForm());
      }
    } catch (error) {
      setProductError(getApiErrorMessage(error, "Ürün işlemi tamamlanamadı."));
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
      return;
    }

    const productName = products.find((product) => product._id === id)?.name || "Ürün";
    setIsDeletingProduct(true);
    setDeletingProductId(id);
    setProductError("");

    try {
      await api.delete(`/products/${id}`);
      setStatusMessage(`${productName} ürünü silindi.`);
      setSelectedEditProductId("");
      setProductForm(createEmptyProductForm(editCategory));
      await loadAdminData();
    } catch (error) {
      setProductError(getApiErrorMessage(error, "Ürün silinemedi."));
    } finally {
      setIsDeletingProduct(false);
      setDeletingProductId("");
    }
  };

  const handleOrderStatusChange = async (orderId, status) => {
    const matchingOrder = orders.find((order) => order._id === orderId);

    setOrderError("");
    setUpdatingOrderId(orderId);

    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setStatusMessage(
        `${matchingOrder ? `#${String(matchingOrder._id).slice(-6).toUpperCase()} ` : ""}siparişi güncellendi.`
      );
      await loadAdminData();
    } catch (error) {
      setOrderError(getApiErrorMessage(error, "Sipariş durumu güncellenemedi."));
    } finally {
      setUpdatingOrderId("");
    }
  };

  const startEditingProduct = (product) => {
    const resolvedCategory =
      categories.find((category) => category._id === (product.category?._id || product.category)) || editCategory;

    setSelectedEditProductId(product._id);
    setProductError("");
    setProductForm(createProductFormFromProduct(product, resolvedCategory));
  };

  const formatVariantSummary = (product) =>
    product.variants.map((variant) => `${variant.name}: ${formatCurrency(variant.price)}`).join(" • ");

  const handleProductModeChange = (nextMode) => {
    setProductMode(nextMode);
    setStatusMessage("");
    resetProductFlow(nextMode);
  };

  const handleCreateCategoryChange = (nextCategoryId) => {
    const nextCategory = categories.find((category) => category._id === nextCategoryId) || null;

    setStatusMessage("");
    setProductError("");
    setCreateCategoryId(nextCategoryId);
    setProductForm(nextCategory ? createEmptyProductForm(nextCategory) : createEmptyProductForm());
  };

  const handleEditCategoryChange = (nextCategoryId) => {
    const nextCategory = categories.find((category) => category._id === nextCategoryId) || null;

    setStatusMessage("");
    setProductError("");
    setEditCategoryId(nextCategoryId);
    setSelectedEditProductId("");
    setProductSearch("");
    setProductForm(nextCategory ? createEmptyProductForm(nextCategory) : createEmptyProductForm());
  };

  const handleProductFieldChange = (field, value) => {
    setProductForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleCategoryCreateFieldChange = (field, value) => {
    setCategoryCreateForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleCategoryEditFieldChange = (field, value) => {
    setCategoryEditForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleManagedCategorySelection = (nextCategoryId) => {
    const nextCategory = categories.find((category) => category._id === nextCategoryId) || null;

    setStatusMessage("");
    setCategoryError("");
    setEditManagedCategoryId(nextCategoryId);
    setCategoryEditForm(nextCategory ? createCategoryFormFromCategory(nextCategory) : createEmptyCategoryForm());
  };

  const saveCategory = async (event, mode) => {
    event.preventDefault();
    const currentForm = mode === "edit" ? categoryEditForm : categoryCreateForm;
    const validationMessage = validateCategoryForm(currentForm);

    if (validationMessage) {
      setCategoryError(validationMessage);
      return;
    }

    setIsSavingCategory(true);
    setCategoryError("");

    try {
      const payload = buildCategoryPayload(currentForm);

      if (mode === "edit" && editManagedCategoryId) {
        const { data } = await api.put(`/categories/${editManagedCategoryId}`, payload);
        const updatedCategory = data.category;
        setCategories((current) => upsertCategoryList(current, updatedCategory));
        setCategoryEditForm(createCategoryFormFromCategory(updatedCategory));
        setEditManagedCategoryId(updatedCategory._id);
        setStatusMessage(`${updatedCategory.name} kategorisi güncellendi.`);
      } else {
        const { data } = await api.post("/categories", payload);
        setCategories((current) => upsertCategoryList(current, data.category));
        setCategoryCreateForm(createEmptyCategoryForm());
        setStatusMessage(`${data.category?.name || payload.name} kategorisi oluşturuldu.`);
      }

      await loadAdminData();
    } catch (error) {
      setCategoryError(getApiErrorMessage(error, "Kategori işlemi tamamlanamadı."));
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const category = categories.find((currentCategory) => currentCategory._id === categoryId);
    const categoryName = category?.name || "Bu kategori";

    if (!window.confirm(`${categoryName} kategorisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    setIsDeletingCategory(true);
    setDeletingCategoryId(categoryId);
    setCategoryError("");

    try {
      await api.delete(`/categories/${categoryId}`);
      setCategories((current) => removeCategoryFromList(current, categoryId));
      setStatusMessage(`${categoryName} kategorisi silindi.`);

      if (editManagedCategoryId === categoryId) {
        setEditManagedCategoryId("");
        setCategoryEditForm(createEmptyCategoryForm());
      }

      await loadAdminData();
    } catch (error) {
      setCategoryError(getApiErrorMessage(error, "Kategori silinemedi."));
    } finally {
      setIsDeletingCategory(false);
      setDeletingCategoryId("");
    }
  };

  const handleVariantPriceChange = (index, value) => {
    setProductForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, price: value } : variant
      )
    }));
  };

  return (
    <section className="admin-shell">
      <div className="page-header page-header--admin">
        <span className="eyebrow">Admin Paneli</span>
        <h1>Paşalı operasyon yönetimi</h1>
        <p>Sipariş, ürün, müşteri ve iletişim alanlarını tek panelden düzenli şekilde yönetin.</p>
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

      <FormMessage type="success" message={statusMessage} />

      {activeTab === "dashboard" && (
        <div className="stack-lg">
          {sectionLoading.dashboard ? (
            <LoadingState message="Genel bakış verileri yükleniyor..." />
          ) : sectionErrors.dashboard ? (
            <ErrorState message={sectionErrors.dashboard} onRetry={loadAdminData} />
          ) : !dashboard ? (
            <EmptyState title="Genel bakış verisi bulunamadı" description="Dashboard kartları şu anda boş görünüyor." />
          ) : (
            <>
              <div className="metrics-grid">
                <article className="metric-card">
                  <div className="metric-card__row">
                    <span>Toplam Sipariş:</span>
                    <strong>{dashboard.metrics.orderCount}</strong>
                  </div>
                </article>
                <article className="metric-card">
                  <div className="metric-card__row">
                    <span>Ürün Sayısı:</span>
                    <strong>{dashboard.metrics.productCount}</strong>
                  </div>
                </article>
                <article className="metric-card">
                  <div className="metric-card__row">
                    <span>Kategori Sayısı:</span>
                    <strong>{dashboard.metrics.categoryCount}</strong>
                  </div>
                </article>
                <article className="metric-card">
                  <div className="metric-card__row">
                    <span>Müşteri Sayısı:</span>
                    <strong>{dashboard.metrics.customerCount}</strong>
                  </div>
                </article>
                <article className="metric-card">
                  <div className="metric-card__row">
                    <span>Havale Siparişi:</span>
                    <strong>{dashboard.metrics.bankTransferOrderCount}</strong>
                  </div>
                </article>
                <article className="metric-card">
                  <div className="metric-card__row">
                    <span>Nakit Siparişi:</span>
                    <strong>{dashboard.metrics.cashOnDeliveryOrderCount}</strong>
                  </div>
                </article>
              </div>

              <div className="admin-overview-grid">
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

                <div className="panel">
                  <h2>Son Havale Siparişleri</h2>
                  <div className="stack-sm">
                    {dashboard.recentBankTransferOrders?.length ? (
                      dashboard.recentBankTransferOrders.map((order) => (
                        <div key={order._id} className="summary-row">
                          <span>
                            {order.user?.firstName} {order.user?.lastName}
                          </span>
                          <strong>{formatDate(order.createdAt)}</strong>
                        </div>
                      ))
                    ) : (
                      <p>Henüz havale siparişi bulunmuyor.</p>
                    )}
                  </div>
                </div>

                <div className="panel">
                  <h2>Son Nakit Siparişleri</h2>
                  <div className="stack-sm">
                    {dashboard.recentCashOrders?.length ? (
                      dashboard.recentCashOrders.map((order) => (
                        <div key={order._id} className="summary-row">
                          <span>
                            {order.user?.firstName} {order.user?.lastName}
                          </span>
                          <strong>{formatDate(order.createdAt)}</strong>
                        </div>
                      ))
                    ) : (
                      <p>Henüz nakit siparişi bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "orders" && (
        <div className="stack-md">
          <FormMessage type="error" message={orderError} />
          {sectionLoading.orders ? (
            <LoadingState message="Sipariş listesi yükleniyor..." />
          ) : sectionErrors.orders ? (
            <ErrorState message={sectionErrors.orders} onRetry={loadAdminData} />
          ) : orders.length ? (
            orders.map((order) => (
              <article key={order._id} className="panel">
                <div className="summary-row">
                  <strong>
                    {order.user?.firstName} {order.user?.lastName}
                  </strong>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <p>{order.user?.email}</p>
                <p>
                  Ara Toplam: {formatCurrency(order.subtotal)} | Teslimat: {formatDeliveryFee(order.deliveryFee)}
                </p>
                <p>Toplam: {formatCurrency(order.totalAmount)}</p>
                <p>Ödeme Yöntemi: {formatPaymentMethod(order.paymentMethod)}</p>
                <p>Ödeme Durumu: {formatPaymentStatus(order.paymentStatus)}</p>
                <p>Adres: {order.addressSnapshot}</p>
                <div className="plain-list">
                  {order.items.map((item) => (
                    <p key={`${order._id}-${item.name}`}>
                      {item.name} x {formatQuantity(item.quantity, item.unit)}
                    </p>
                  ))}
                </div>
                <select
                  value={order.status}
                  onChange={(event) => handleOrderStatusChange(order._id, event.target.value)}
                  disabled={updatingOrderId === order._id}
                  aria-busy={updatingOrderId === order._id}
                >
                  <option value="Hazirlaniyor">Hazırlanıyor</option>
                  <option value="Teslimata Cikti">Teslimata Çıktı</option>
                  <option value="Tamamlandi">Tamamlandı</option>
                  <option value="Iptal Edildi">İptal Edildi</option>
                </select>
                {updatingOrderId === order._id ? (
                  <p className="helper-text">Sipariş durumu güncelleniyor...</p>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState title="Henüz sipariş bulunmuyor" description="Yeni siparişler geldiğinde bu listede görünecek." />
          )}
        </div>
      )}

      {activeTab === "categories" && (
        <div className="stack-md">
          <div className="panel stack-md">
            <div className="section-heading">
              <span className="eyebrow">Kategori Yönetimi</span>
              <h2>Kategorileri yönetin</h2>
            </div>

            {sectionLoading.categories ? (
              <LoadingState message="Kategoriler yükleniyor..." compact />
            ) : categoryManagementState.showError ? (
              <ErrorState message={sectionErrors.categories} onRetry={loadAdminData} compact />
            ) : categoryManagementState.showEmpty ? (
              <EmptyState title="Henüz kategori bulunmuyor" description="İlk kategoriyi oluşturarak başlayabilirsiniz." compact />
            ) : (
              <div className="admin-category-list">
                {categories.map((category) => (
                  <article key={category._id} className="admin-category-row">
                    <div className="admin-category-row__header">
                      <div>
                        <strong>{category.name}</strong>
                        <p className="helper-text">Slug: {category.slug}</p>
                      </div>
                      <div className="admin-product-meta">
                        <span>Sıra: {category.sortOrder ?? 0}</span>
                        <span>{category.isActive === false ? "Pasif" : "Aktif"}</span>
                        <span>
                          {sectionErrors.products
                            ? "Ürün sayısı yüklenemedi"
                            : `${getCategoryProductCount(products, category._id)} ürün`}
                        </span>
                      </div>
                    </div>
                    <p>{category.description}</p>
                    <div className="inline-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {
                          setActiveTab("categories");
                          handleManagedCategorySelection(category._id);
                        }}
                        disabled={isSavingCategory || isDeletingCategory}
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => handleDeleteCategory(category._id)}
                        disabled={isSavingCategory || isDeletingCategory}
                      >
                        {isDeletingCategory && deletingCategoryId === category._id ? "Siliniyor..." : "Sil"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="admin-mode-switch">
            <form className="panel stack-md" onSubmit={(event) => saveCategory(event, "create")}>
              <div className="section-heading">
                <span className="eyebrow">Yeni Kategori</span>
                <h2>Kategori oluştur</h2>
              </div>

              {categoryError && !categoryManagementState.showEditForm && <p className="error-text">{categoryError}</p>}

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Kategori adı</span>
                  <input
                    value={categoryCreateForm.name}
                    onChange={(event) => handleCategoryCreateFieldChange("name", event.target.value)}
                    disabled={isSavingCategory || isDeletingCategory}
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Slug</span>
                  <input
                    value={categoryCreateForm.slug}
                    onChange={(event) => handleCategoryCreateFieldChange("slug", event.target.value)}
                    disabled={isSavingCategory || isDeletingCategory}
                    placeholder="Boş bırakılırsa otomatik oluşturulur"
                  />
                </label>
              </div>

              <label className="admin-field">
                <span>Açıklama</span>
                <textarea
                  value={categoryCreateForm.description}
                  onChange={(event) => handleCategoryCreateFieldChange("description", event.target.value)}
                  disabled={isSavingCategory || isDeletingCategory}
                  required
                />
              </label>

              <div className="admin-form-grid">
                <label className="admin-field">
                  <span>Görsel yolu</span>
                  <input
                    value={categoryCreateForm.imageUrl}
                    onChange={(event) => handleCategoryCreateFieldChange("imageUrl", event.target.value)}
                    disabled={isSavingCategory || isDeletingCategory}
                    required
                  />
                </label>
                <label className="admin-field">
                  <span>Sıralama</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={categoryCreateForm.sortOrder}
                    onChange={(event) => handleCategoryCreateFieldChange("sortOrder", event.target.value)}
                    disabled={isSavingCategory || isDeletingCategory}
                    required
                  />
                </label>
              </div>

              <div className="admin-toggle-grid">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={categoryCreateForm.isActive}
                    onChange={(event) => handleCategoryCreateFieldChange("isActive", event.target.checked)}
                    disabled={isSavingCategory || isDeletingCategory}
                  />
                  Kategori aktif
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={categoryCreateForm.isFeatured}
                    onChange={(event) => handleCategoryCreateFieldChange("isFeatured", event.target.checked)}
                    disabled={isSavingCategory || isDeletingCategory}
                  />
                  Öne çıkan kategori
                </label>
              </div>

              <div className="inline-actions">
                <button type="submit" className="primary-button" disabled={isSavingCategory || isDeletingCategory}>
                  {isSavingCategory ? "Kategori kaydediliyor..." : "Kategoriyi Kaydet"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setCategoryError("");
                    setCategoryCreateForm(createEmptyCategoryForm());
                  }}
                  disabled={isSavingCategory || isDeletingCategory}
                >
                  Formu Temizle
                </button>
              </div>
            </form>

            <div className="panel stack-md">
              <div className="section-heading">
                <span className="eyebrow">Kategori Güncelle</span>
                <h2>Kategori seçip düzenleyin</h2>
              </div>

              <label className="admin-field">
                <span>Kategori seçimi</span>
                <select
                  value={editManagedCategoryId}
                  onChange={(event) => handleManagedCategorySelection(event.target.value)}
                  disabled={isSavingCategory || isDeletingCategory || sectionLoading.categories}
                >
                  <option value="">Kategori seçin</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {getCategoryOptionLabel(category)}
                    </option>
                  ))}
                </select>
              </label>

              {!categoryManagementState.showEditForm ? (
                <div className="info-banner">Güncelleme için önce kategori seçin.</div>
              ) : (
                <form className="stack-md" onSubmit={(event) => saveCategory(event, "edit")}>
                  {categoryError && <p className="error-text">{categoryError}</p>}

                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Kategori adı</span>
                      <input
                        value={categoryEditForm.name}
                        onChange={(event) => handleCategoryEditFieldChange("name", event.target.value)}
                        disabled={isSavingCategory || isDeletingCategory}
                        required
                      />
                    </label>
                    <label className="admin-field">
                      <span>Slug</span>
                      <input
                        value={categoryEditForm.slug}
                        onChange={(event) => handleCategoryEditFieldChange("slug", event.target.value)}
                        disabled={isSavingCategory || isDeletingCategory}
                      />
                    </label>
                  </div>

                  <label className="admin-field">
                    <span>Açıklama</span>
                    <textarea
                      value={categoryEditForm.description}
                      onChange={(event) => handleCategoryEditFieldChange("description", event.target.value)}
                      disabled={isSavingCategory || isDeletingCategory}
                      required
                    />
                  </label>

                  <div className="admin-form-grid">
                    <label className="admin-field">
                      <span>Görsel yolu</span>
                      <input
                        value={categoryEditForm.imageUrl}
                        onChange={(event) => handleCategoryEditFieldChange("imageUrl", event.target.value)}
                        disabled={isSavingCategory || isDeletingCategory}
                        required
                      />
                    </label>
                    <label className="admin-field">
                      <span>Sıralama</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={categoryEditForm.sortOrder}
                        onChange={(event) => handleCategoryEditFieldChange("sortOrder", event.target.value)}
                        disabled={isSavingCategory || isDeletingCategory}
                        required
                      />
                    </label>
                  </div>

                  <div className="admin-toggle-grid">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={categoryEditForm.isActive}
                        onChange={(event) => handleCategoryEditFieldChange("isActive", event.target.checked)}
                        disabled={isSavingCategory || isDeletingCategory}
                      />
                      Kategori aktif
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={categoryEditForm.isFeatured}
                        onChange={(event) => handleCategoryEditFieldChange("isFeatured", event.target.checked)}
                        disabled={isSavingCategory || isDeletingCategory}
                      />
                      Öne çıkan kategori
                    </label>
                  </div>

                  {managedCategory && (
                    <p className="helper-text">
                      Bu kategoride şu anda <strong>{getCategoryProductCount(products, managedCategory._id)}</strong> ürün
                      bulunuyor.
                    </p>
                  )}

                  <div className="inline-actions">
                    <button type="submit" className="primary-button" disabled={isSavingCategory || isDeletingCategory}>
                      {isSavingCategory ? "Kategori güncelleniyor..." : "Kategoriyi Güncelle"}
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => handleManagedCategorySelection("")}
                      disabled={isSavingCategory || isDeletingCategory}
                    >
                      Seçimi Temizle
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => handleDeleteCategory(editManagedCategoryId)}
                      disabled={isSavingCategory || isDeletingCategory}
                    >
                      {isDeletingCategory && deletingCategoryId === editManagedCategoryId
                        ? "Kategori siliniyor..."
                        : "Kategoriyi Sil"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="stack-md">
          <div className="admin-mode-switch">
            {Object.entries(productModeLabels).map(([modeKey, label]) => (
              <button
                key={modeKey}
                type="button"
                className={`panel admin-mode-card ${productMode === modeKey ? "admin-mode-card--active" : ""}`}
                onClick={() => handleProductModeChange(modeKey)}
              >
                <span className="eyebrow">Ürünler</span>
                <strong>{label}</strong>
                <span className="helper-text">
                  {modeKey === "create"
                    ? "Önce kategori seçin, sonra kategoriye uygun formu doldurun."
                    : "Önce kategori ve ürün seçin, sonra mevcut bilgileri güncelleyin."}
                </span>
              </button>
            ))}
          </div>

          <div className="panel stack-md">
            <div className="section-heading">
              <span className="eyebrow">Ürün Yönetimi</span>
              <h2>{productModeLabels[productMode]}</h2>
            </div>

            {sectionLoading.categories || sectionLoading.products ? (
              <LoadingState message="Ürün bilgileri yükleniyor..." compact />
            ) : productsSectionError ? (
              <ErrorState message={productsSectionError} onRetry={loadAdminData} compact />
            ) : (
              <>
                {productMode === "create" ? (
                  <div className="stack-md">
                    <div className="admin-step-card">
                      <div className="summary-row">
                        <strong>1. Adım</strong>
                        <span>Kategori seçimi</span>
                      </div>
                      <select
                        value={createCategoryId}
                        onChange={(event) => handleCreateCategoryChange(event.target.value)}
                        disabled={isSavingProduct}
                      >
                        <option value="">Kategori seçin</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {getCategoryOptionLabel(category)}
                          </option>
                        ))}
                      </select>
                      {!createCategoryId && <div className="info-banner">Kategori seçilmedi.</div>}
                    </div>

                    {createCategory && (
                      <form className="stack-md" onSubmit={saveProduct}>
                        <div className="admin-step-card">
                          <div className="summary-row">
                            <strong>2. Adım</strong>
                            <span>{createCategory.name} için ürün bilgileri</span>
                          </div>
                          <p className="helper-text">
                            Varsayılan birim: <strong>{activeProductConfig.defaultUnit}</strong>
                          </p>
                          {activeProductConfig.categorySummary && (
                            <div className="helper-text helper-text--panel">{activeProductConfig.categorySummary}</div>
                          )}
                          {activeProductConfig.helperText && (
                            <div className="helper-text helper-text--panel">{activeProductConfig.helperText}</div>
                          )}
                        </div>

                        {productError && <p className="error-text">{productError}</p>}

                        <div className="form-grid">
                          <input
                            placeholder="Ürün adı"
                            value={productForm.name}
                            onChange={(event) => handleProductFieldChange("name", event.target.value)}
                            disabled={isSavingProduct}
                            required
                          />
                          <select
                            value={productForm.unit}
                            onChange={(event) => handleProductFieldChange("unit", event.target.value)}
                            disabled={activeProductConfig.unitOptions.length === 1 || isSavingProduct}
                          >
                            {activeProductConfig.unitOptions.map((unitOption) => (
                              <option key={unitOption} value={unitOption}>
                                {unitOption}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          placeholder="Ürün açıklaması"
                          value={productForm.description}
                          onChange={(event) => handleProductFieldChange("description", event.target.value)}
                          disabled={isSavingProduct}
                          required
                        />

                        {activeProductConfig.usesVariants ? (
                          <div className="admin-step-card">
                            <strong>{activeProductConfig.variantTitle}</strong>
                            <div className="form-grid">
                              {productForm.variants.map((variant, index) => (
                                <input
                                  key={variant.id}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={`${variant.name} fiyatı`}
                                  value={variant.price}
                                  onChange={(event) => handleVariantPriceChange(index, event.target.value)}
                                  disabled={isSavingProduct}
                                  required
                                />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={activeProductConfig.directPriceLabel}
                            value={productForm.price}
                            onChange={(event) => handleProductFieldChange("price", event.target.value)}
                            disabled={isSavingProduct}
                            required
                          />
                        )}

                        <input
                          placeholder="Ürün görseli yolu veya URL"
                          value={productForm.image}
                          onChange={(event) => handleProductFieldChange("image", event.target.value)}
                          disabled={isSavingProduct}
                        />
                        <p className="helper-text">
                          Görsel boş bırakılırsa kategori görseli fallback olarak kullanılır.
                        </p>
                        {previewImage && <img src={previewImage} alt="Ürün önizleme" className="admin-image-preview" />}

                        <div className="form-grid">
                          {activeProductConfig.showWeightField && (
                            <input
                              placeholder="Gramaj"
                              value={productForm.weight}
                              onChange={(event) => handleProductFieldChange("weight", event.target.value)}
                              disabled={isSavingProduct}
                            />
                          )}
                          {activeProductConfig.showPortionField && (
                            <input
                              placeholder="Porsiyon"
                              value={productForm.portion}
                              onChange={(event) => handleProductFieldChange("portion", event.target.value)}
                              disabled={isSavingProduct}
                            />
                          )}
                        </div>

                        <div className="form-grid">
                          <input
                            placeholder="Raf ömrü"
                            value={productForm.shelfLife}
                            onChange={(event) => handleProductFieldChange("shelfLife", event.target.value)}
                            disabled={isSavingProduct}
                            required
                          />
                          <input
                            placeholder="Saklama koşulu"
                            value={productForm.storageCondition}
                            onChange={(event) => handleProductFieldChange("storageCondition", event.target.value)}
                            disabled={isSavingProduct}
                            required
                          />
                        </div>

                        <div className="form-grid">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Stok miktarı"
                            value={productForm.stockQuantity}
                            onChange={(event) => handleProductFieldChange("stockQuantity", event.target.value)}
                            disabled={isSavingProduct}
                            required
                          />
                          <select
                            value={productForm.stockStatus}
                            onChange={(event) => handleProductFieldChange("stockStatus", event.target.value)}
                            disabled={isSavingProduct}
                          >
                            <option value="in_stock">Stokta</option>
                            <option value="limited">Sınırlı</option>
                            <option value="out_of_stock">Tükendi</option>
                          </select>
                        </div>

                        <div className="form-grid">
                          <select
                            value={productForm.isActive ? "active" : "passive"}
                            onChange={(event) => handleProductFieldChange("isActive", event.target.value === "active")}
                            disabled={isSavingProduct}
                          >
                            <option value="active">Aktif</option>
                            <option value="passive">Pasif</option>
                          </select>
                          <label className="checkbox-row checkbox-row--inline">
                            <input
                              type="checkbox"
                              checked={productForm.featured}
                              onChange={(event) => handleProductFieldChange("featured", event.target.checked)}
                              disabled={isSavingProduct}
                            />
                            Öne çıkan ürün
                          </label>
                        </div>

                        <div className="inline-actions">
                          <button type="submit" className="primary-button" disabled={isSavingProduct}>
                            {isSavingProduct ? "Ürün ekleniyor..." : "Ürünü Kaydet"}
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => handleCreateCategoryChange("")}
                            disabled={isSavingProduct}
                          >
                            Formu Temizle
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="stack-md">
                    <div className="admin-step-card">
                      <div className="summary-row">
                        <strong>1. Adım</strong>
                        <span>Kategori seçimi</span>
                      </div>
                      <select
                        value={editCategoryId}
                        onChange={(event) => handleEditCategoryChange(event.target.value)}
                        disabled={isSavingProduct || isDeletingProduct}
                      >
                        <option value="">Kategori seçin</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {getCategoryOptionLabel(category)}
                          </option>
                        ))}
                      </select>
                      {!editCategoryId && <div className="info-banner">Kategori seçilmedi.</div>}
                    </div>

                    {editCategory && (
                      <>
                        <div className="admin-step-card">
                          <div className="summary-row">
                            <strong>2. Adım</strong>
                            <span>Ürün seçimi</span>
                          </div>
                          {productsInSelectedCategory.length ? (
                            <>
                              <input
                                type="search"
                                placeholder="Seçilen kategoride ürün ara"
                                value={productSearch}
                                onChange={(event) => setProductSearch(event.target.value)}
                                disabled={isSavingProduct || isDeletingProduct}
                              />
                              <div className="admin-product-picker">
                                {filteredProductsInSelectedCategory.length ? (
                                  filteredProductsInSelectedCategory.map((product) => (
                                    <button
                                      key={product._id}
                                      type="button"
                                      className={`admin-product-option ${
                                        selectedEditProductId === product._id ? "admin-product-option--active" : ""
                                      }`}
                                      onClick={() => startEditingProduct(product)}
                                    >
                                      <strong>{product.name}</strong>
                                      <span>{formatProductPrice(product)}</span>
                                      <small>
                                        Stok durumu: {stockLabels[product.stockStatus] || product.stockStatus || "Belirtilmedi"}
                                      </small>
                                      <small>{product.isActive === false ? "Pasif" : "Aktif"}</small>
                                      {hasProductVariants(product) && <small>{formatVariantSummary(product)}</small>}
                                    </button>
                                  ))
                                ) : (
                                  <div className="info-banner">Arama kriterinize uygun ürün bulunamadı.</div>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="info-banner">Seçilen kategoride ürün bulunamadı.</div>
                          )}
                        </div>

                        {!selectedEditProductId ? (
                          productsInSelectedCategory.length > 0 && <div className="info-banner">Ürün seçilmedi.</div>
                        ) : (
                          <form className="stack-md" onSubmit={saveProduct}>
                            <div className="admin-step-card">
                              <div className="summary-row">
                                <strong>3. Adım</strong>
                                <span>Ürün bilgilerini güncelle</span>
                              </div>
                              <div className="admin-product-meta">
                                <span>Stok durumu: {stockLabels[productForm.stockStatus] || productForm.stockStatus}</span>
                                <span>{productForm.isActive ? "Aktif" : "Pasif"}</span>
                                <span>{productForm.unit}</span>
                              </div>
                              {activeProductConfig.helperText && (
                                <div className="helper-text helper-text--panel">{activeProductConfig.helperText}</div>
                              )}
                            </div>

                            {productError && <p className="error-text">{productError}</p>}

                            <div className="form-grid">
                              <input
                                placeholder="Ürün adı"
                                value={productForm.name}
                                onChange={(event) => handleProductFieldChange("name", event.target.value)}
                                disabled={isSavingProduct || isDeletingProduct}
                                required
                              />
                              <select
                                value={productForm.category}
                                onChange={(event) => {
                                  const nextCategory =
                                    categories.find((category) => category._id === event.target.value) || null;

                                  setProductForm((current) =>
                                    applyCategoryConfigToForm(
                                      {
                                        ...current,
                                        category: event.target.value
                                      },
                                      nextCategory
                                    )
                                  );
                                }}
                                disabled={isSavingProduct || isDeletingProduct}
                              >
                                {categories.map((category) => (
                                  <option key={category._id} value={category._id}>
                                    {getCategoryOptionLabel(category)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <textarea
                              placeholder="Ürün açıklaması"
                              value={productForm.description}
                              onChange={(event) => handleProductFieldChange("description", event.target.value)}
                              disabled={isSavingProduct || isDeletingProduct}
                              required
                            />

                            <div className="form-grid">
                              {activeProductConfig.usesVariants ? (
                                <div className="helper-text helper-text--panel">
                                  Bu ürün için fiyatlar boy seçeneklerinden yönetilir.
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={activeProductConfig.directPriceLabel}
                                  value={productForm.price}
                                  onChange={(event) => handleProductFieldChange("price", event.target.value)}
                                  disabled={isSavingProduct || isDeletingProduct}
                                  required
                                />
                              )}
                              <select
                                value={productForm.unit}
                                onChange={(event) => handleProductFieldChange("unit", event.target.value)}
                                disabled={
                                  activeProductConfig.unitOptions.length === 1 || isSavingProduct || isDeletingProduct
                                }
                              >
                                {activeProductConfig.unitOptions.map((unitOption) => (
                                  <option key={unitOption} value={unitOption}>
                                    {unitOption}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {activeProductConfig.usesVariants && (
                              <div className="admin-step-card">
                                <strong>{activeProductConfig.variantTitle}</strong>
                                <div className="form-grid">
                                  {productForm.variants.map((variant, index) => (
                                    <input
                                      key={variant.id}
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder={`${variant.name} fiyatı`}
                                      value={variant.price}
                                      onChange={(event) => handleVariantPriceChange(index, event.target.value)}
                                      disabled={isSavingProduct || isDeletingProduct}
                                      required
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            <input
                              placeholder="Ürün görseli yolu veya URL"
                              value={productForm.image}
                              onChange={(event) => handleProductFieldChange("image", event.target.value)}
                              disabled={isSavingProduct || isDeletingProduct}
                            />
                            <p className="helper-text">
                              Görsel boş bırakılırsa kategori görseli fallback olarak kullanılır.
                            </p>
                            {previewImage && (
                              <img src={previewImage} alt="Ürün önizleme" className="admin-image-preview" />
                            )}

                            <div className="form-grid">
                              {activeProductConfig.showWeightField && (
                                <input
                                  placeholder="Gramaj"
                                  value={productForm.weight}
                                  onChange={(event) => handleProductFieldChange("weight", event.target.value)}
                                  disabled={isSavingProduct || isDeletingProduct}
                                />
                              )}
                              {activeProductConfig.showPortionField && (
                                <input
                                  placeholder="Porsiyon"
                                  value={productForm.portion}
                                  onChange={(event) => handleProductFieldChange("portion", event.target.value)}
                                  disabled={isSavingProduct || isDeletingProduct}
                                />
                              )}
                            </div>

                            <div className="form-grid">
                              <input
                                placeholder="Raf ömrü"
                                value={productForm.shelfLife}
                                onChange={(event) => handleProductFieldChange("shelfLife", event.target.value)}
                                disabled={isSavingProduct || isDeletingProduct}
                                required
                              />
                              <input
                                placeholder="Saklama koşulu"
                                value={productForm.storageCondition}
                                onChange={(event) => handleProductFieldChange("storageCondition", event.target.value)}
                                disabled={isSavingProduct || isDeletingProduct}
                                required
                              />
                            </div>

                            <div className="form-grid">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Stok miktarı"
                                value={productForm.stockQuantity}
                                onChange={(event) => handleProductFieldChange("stockQuantity", event.target.value)}
                                disabled={isSavingProduct || isDeletingProduct}
                                required
                              />
                              <select
                                value={productForm.stockStatus}
                                onChange={(event) => handleProductFieldChange("stockStatus", event.target.value)}
                                disabled={isSavingProduct || isDeletingProduct}
                              >
                                <option value="in_stock">Stokta</option>
                                <option value="limited">Sınırlı</option>
                                <option value="out_of_stock">Tükendi</option>
                              </select>
                            </div>

                            <div className="form-grid">
                              <select
                                value={productForm.isActive ? "active" : "passive"}
                                onChange={(event) =>
                                  handleProductFieldChange("isActive", event.target.value === "active")
                                }
                                disabled={isSavingProduct || isDeletingProduct}
                              >
                                <option value="active">Aktif</option>
                                <option value="passive">Pasif</option>
                              </select>
                              <label className="checkbox-row checkbox-row--inline">
                                <input
                                  type="checkbox"
                                  checked={productForm.featured}
                                  onChange={(event) => handleProductFieldChange("featured", event.target.checked)}
                                  disabled={isSavingProduct || isDeletingProduct}
                                />
                                Öne çıkan ürün
                              </label>
                            </div>

                            <div className="inline-actions">
                              <button
                                type="submit"
                                className="primary-button"
                                disabled={isSavingProduct || isDeletingProduct}
                              >
                                {isSavingProduct ? "Ürün güncelleniyor..." : "Ürünü Güncelle"}
                              </button>
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() => handleEditCategoryChange(editCategoryId)}
                                disabled={isSavingProduct || isDeletingProduct}
                              >
                                Seçimi Temizle
                              </button>
                              <button
                                type="button"
                                className="text-button"
                                onClick={() => handleDeleteProduct(selectedEditProductId)}
                                disabled={isSavingProduct || isDeletingProduct}
                              >
                                {isDeletingProduct && deletingProductId === selectedEditProductId
                                  ? "Ürün siliniyor..."
                                  : "Ürünü Sil"}
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === "customers" && (
        <div className="stack-sm">
          {sectionLoading.customers ? (
            <LoadingState message="Müşteri listesi yükleniyor..." />
          ) : sectionErrors.customers ? (
            <ErrorState message={sectionErrors.customers} onRetry={loadAdminData} />
          ) : (
            <>
              <div className="panel stack-sm">
                <div className="summary-row">
                  <strong>Müşteri Arama</strong>
                  <span>{filteredCustomers.length} kayıt</span>
                </div>
                <div className="form-grid">
                  <label className="stack-xs form-field" htmlFor="customer-search-field">
                    <span>Arama alanı</span>
                    <select
                      id="customer-search-field"
                      value={customerSearchField}
                      onChange={(event) => setCustomerSearchField(event.target.value)}
                    >
                      {Object.entries(customerFilterLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="stack-xs form-field" htmlFor="customer-search-term">
                    <span>Müşteri arama</span>
                    <input
                      id="customer-search-term"
                      type="search"
                      placeholder="Ad, e-posta veya telefon"
                      value={customerSearchTerm}
                      onChange={(event) => setCustomerSearchTerm(event.target.value)}
                    />
                  </label>
                </div>
                {customerSearchTerm ? (
                  <p className="helper-text">
                    Arama alanı: <strong>{customerFilterLabels[customerSearchField]}</strong>
                  </p>
                ) : (
                  <p className="helper-text">
                    Ad, e-posta, telefon, adres veya fatura bilgisine göre filtreleyebilirsiniz.
                  </p>
                )}
              </div>

              {filteredCustomers.length ? (
                filteredCustomers.map((customer) => (
                  <article key={customer.id} className="panel">
                    <strong>
                      {customer.firstName} {customer.lastName}
                    </strong>
                    <p>{customer.email}</p>
                    <p>{customer.phone}</p>
                    <p>{customer.address}</p>
                    <p>Fatura: {customer.invoiceInfo?.fullName || "Bilgi yok"}</p>
                    <p>Kayıt Tarihi: {customer.createdAt ? formatDate(customer.createdAt) : "Bilgi yok"}</p>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Arama kriterinize uygun müşteri bulunamadı"
                  description="Filtreleri değiştirerek yeniden deneyebilirsiniz."
                  compact
                />
              )}
            </>
          )}
        </div>
      )}

    </section>
  );
};

export default AdminDashboardPage;
