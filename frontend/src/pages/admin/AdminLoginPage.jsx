import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, logout } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const { user } = await login(form);

      if (user.role !== "admin") {
        logout();
        setError("Bu panel sadece yoneticiler icindir.");
        return;
      }

      navigate("/admin/dashboard");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Admin girisi basarisiz.");
    }
  };

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Yonetici Girisi</span>
        <h1>Admin Paneli</h1>
        <input
          type="email"
          placeholder="Admin e-postasi"
          required
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
        />
        <input
          type="password"
          placeholder="Sifre"
          required
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
        />
        {error && <p className="error-text">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading}>
          Admin Girisi
        </button>
      </form>
    </section>
  );
};

export default AdminLoginPage;
