import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { pasaliBrand } from "../data/pasaliCatalog";

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
        <img src={pasaliBrand.logo} alt={pasaliBrand.name} className="brand-mark__logo" />
        <span>
          <strong>{pasaliBrand.name}</strong>
          <small>{pasaliBrand.tagline}</small>
        </span>
      </Link>

      <nav className="site-nav">
        <NavLink to="/">Ana Sayfa</NavLink>
        <NavLink to="/products">Ürünler</NavLink>
        <NavLink to="/cart">Sepet ({itemCount})</NavLink>
        {user?.role === "customer" && <NavLink to="/orders">Siparişlerim</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin/dashboard">Admin Panel</NavLink>}
      </nav>

      <div className="site-actions">
        {!isAuthenticated ? (
          <>
            <Link to="/login" className="ghost-button">
              Giriş
            </Link>
            <Link to="/register" className="primary-button">
              Kayıt Ol
            </Link>
          </>
        ) : (
          <>
            <span className="welcome-text">{user.firstName}</span>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Çıkış
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
