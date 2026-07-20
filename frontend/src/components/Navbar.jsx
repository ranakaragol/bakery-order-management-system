import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { pasaliBrand } from "../data/pasaliCatalog";
import { buildAuthRedirectLink } from "../utils/authNavigation";
import { formatQuantityValue } from "../utils/formatters";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  return (
    <header className="site-header">
      <Link to="/" className="brand-mark" onClick={scrollToTop}>
        <img src={pasaliBrand.logo} alt={pasaliBrand.name} className="brand-mark__logo" />
        <span>
          <strong>{pasaliBrand.name}</strong>
          <small>{pasaliBrand.tagline}</small>
        </span>
      </Link>

      <nav className="site-nav">
        <NavLink to="/" onClick={scrollToTop}>
          Ana Sayfa
        </NavLink>
        <NavLink to="/about" onClick={scrollToTop}>
          Hakkımızda
        </NavLink>
        <NavLink to="/products" onClick={scrollToTop}>
          Ürünler
        </NavLink>
        {user?.role !== "admin" && (
          <NavLink to="/cart" onClick={scrollToTop}>
            Sepet ({formatQuantityValue(itemCount)})
          </NavLink>
        )}
        {user?.role === "customer" && <NavLink to="/orders">Siparişlerim</NavLink>}
        {user?.role === "admin" && <NavLink to="/admin/dashboard">Admin Panel</NavLink>}
      </nav>

      <div className="site-actions">
        {!isAuthenticated ? (
          <>
            <Link to={buildAuthRedirectLink("/login", location.pathname, location.search)} className="ghost-button">
              Giriş
            </Link>
            <Link
              to={buildAuthRedirectLink("/register", location.pathname, location.search)}
              className="primary-button"
            >
              Kayıt Ol
            </Link>
          </>
        ) : (
          <>
            {user?.role === "customer" ? (
              <Link to="/profile" className="welcome-text">
                {user.firstName}
              </Link>
            ) : (
              <Link to="/admin/profile" className="welcome-text" onClick={scrollToTop}>
                {user.firstName}
              </Link>
            )}
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
