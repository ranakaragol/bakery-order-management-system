import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./guards/ProtectedRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";
import HomePage from "./pages/customer/HomePage";
import LoginPage from "./pages/customer/LoginPage";
import OrdersPage from "./pages/customer/OrdersPage";
import ProductDetailPage from "./pages/customer/ProductDetailPage";
import ProductsPage from "./pages/customer/ProductsPage";
import RegisterPage from "./pages/customer/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";

const App = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route element={<ProtectedRoute requiredRole="customer" />}>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Route>
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default App;
