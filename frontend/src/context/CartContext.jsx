import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!isAuthenticated || user?.role !== "customer") {
      setCart(null);
      return null;
    }

    setLoading(true);

    try {
      const { data } = await api.get("/cart");
      setCart(data);
      return data;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, user?.role]);

  const addToCart = async (productId, quantity = 1) => {
    const { data } = await api.post("/cart/items", { productId, quantity });
    setCart(data.cart);
    return data.cart;
  };

  const updateCartItem = async (itemId, quantity) => {
    const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
    setCart(data.cart);
    return data.cart;
  };

  const removeCartItem = async (itemId) => {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    setCart(data.cart);
    return data.cart;
  };

  const clearCart = async () => {
    const { data } = await api.delete("/cart");
    setCart(data.cart);
    return data.cart;
  };

  const value = {
    cart,
    loading,
    itemCount: cart?.itemCount || 0,
    subtotal: cart?.subtotal || 0,
    refreshCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
