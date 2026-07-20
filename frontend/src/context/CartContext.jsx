import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api from "../api/client";
import { getApiErrorMessage } from "../utils/apiErrors";
import { useAuth } from "./AuthContext";
import { sanitizeQuantity } from "../../../shared/commerce.js";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [pendingItemIds, setPendingItemIds] = useState([]);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);
  const hasCartRef = useRef(false);

  useEffect(() => {
    hasCartRef.current = Boolean(cart);
  }, [cart]);

  const markItemPending = (itemId, isPending) => {
    setPendingItemIds((current) =>
      isPending ? [...new Set([...current, itemId])] : current.filter((currentItemId) => currentItemId !== itemId)
    );
  };

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "customer") {
      setCart(null);
      setError("");
      return null;
    }

    const hasVisibleCart = hasCartRef.current;

    if (hasVisibleCart) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get("/cart");
      setCart(data);
      setError("");
      return data;
    } catch (error) {
      setCart(null);
      setError(getApiErrorMessage(error, "Sepet bilgileri yüklenemedi."));
      return null;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1, variantId = "") => {
    const sanitizedQuantity = sanitizeQuantity(quantity);
    setIsAddingItem(true);
    setError("");

    try {
      const { data } = await api.post("/cart/items", {
        productId,
        quantity: Number.isFinite(sanitizedQuantity) ? sanitizedQuantity : quantity,
        variantId
      });
      setCart(data.cart);
      return data.cart;
    } catch (error) {
      const nextError = getApiErrorMessage(error, "Ürün sepete eklenemedi.");
      setError(nextError);
      throw error;
    } finally {
      setIsAddingItem(false);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    const sanitizedQuantity = sanitizeQuantity(quantity);
    markItemPending(itemId, true);
    setError("");

    try {
      const { data } = await api.put(`/cart/items/${itemId}`, {
        quantity: Number.isFinite(sanitizedQuantity) ? sanitizedQuantity : quantity
      });
      setCart(data.cart);
      return data.cart;
    } catch (error) {
      const nextError = getApiErrorMessage(error, "Sepet ürünü güncellenemedi.");
      setError(nextError);
      throw error;
    } finally {
      markItemPending(itemId, false);
    }
  };

  const removeCartItem = async (itemId) => {
    markItemPending(itemId, true);
    setError("");

    try {
      const { data } = await api.delete(`/cart/items/${itemId}`);
      setCart(data.cart);
      return data.cart;
    } catch (error) {
      const nextError = getApiErrorMessage(error, "Sepet ürünü kaldırılamadı.");
      setError(nextError);
      throw error;
    } finally {
      markItemPending(itemId, false);
    }
  };

  const clearCart = async () => {
    setIsClearingCart(true);
    setError("");

    try {
      const { data } = await api.delete("/cart");
      setCart(data.cart);
      return data.cart;
    } catch (error) {
      const nextError = getApiErrorMessage(error, "Sepet temizlenemedi.");
      setError(nextError);
      throw error;
    } finally {
      setIsClearingCart(false);
    }
  };

  const value = {
    cart,
    loading,
    refreshing,
    error,
    isAddingItem,
    isClearingCart,
    pendingItemIds,
    itemCount: cart?.itemCount || 0,
    subtotal: cart?.subtotal || 0,
    refreshCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    clearError: () => setError(""),
    isItemPending: (itemId) => pendingItemIds.includes(itemId)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
