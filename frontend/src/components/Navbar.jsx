import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="site-header">
      <Link to="/" className="brand-mark">
        <span className="brand-mark__badge">FA</span>
        <span>
          <strong>Firin Atelier</strong>
          <small>Butik pasta evi</small>
        </span>
      </Link>

      <nav className="site-nav">
        <NavLink to="/">Ana Sayfa</NavLink>
        <NavLink to="/products">Urunler</NavLink>
        <NavLink to="/cart">Sepet ({itemCount})</NavLink>
        {user?.role === "customer" && <NavLink to="/orders">Siparislerim</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin/dashboard">Admin Panel</NavLink>}
      </nav>

      <div className="site-actions">
        {!isAuthenticated ? (
          <>
            <Link to="/login" className="ghost-button">
              Giris
            </Link>
            <Link to="/register" className="primary-button">
              Kayit Ol
            </Link>
          </>
        ) : (
          <>
            <span className="welcome-text">{user.firstName}</span>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Cikis
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
