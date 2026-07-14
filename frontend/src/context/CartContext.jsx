import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "./AuthContext";
import { sanitizeQuantity } from "../../../shared/commerce.js";

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
    } catch (error) {
      setCart(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, user?.role]);

  const addToCart = async (productId, quantity = 1, variantId = "") => {
    const sanitizedQuantity = sanitizeQuantity(quantity);
    const { data } = await api.post("/cart/items", {
      productId,
      quantity: Number.isFinite(sanitizedQuantity) ? sanitizedQuantity : quantity,
      variantId
    });
    setCart(data.cart);
    return data.cart;
  };

  const updateCartItem = async (itemId, quantity) => {
    const sanitizedQuantity = sanitizeQuantity(quantity);
    const { data } = await api.put(`/cart/items/${itemId}`, {
      quantity: Number.isFinite(sanitizedQuantity) ? sanitizedQuantity : quantity
    });
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
