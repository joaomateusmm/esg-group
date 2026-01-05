"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1. Carregar do LocalStorage ao iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem("@submind:cart");
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, []);

  // 2. Salvar no LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("@submind:cart", JSON.stringify(items));
  }, [items]);

  // Adicionar item
  const addItem = (product: Omit<CartItem, "quantity">) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);

      // Se já existe, aumenta a quantidade (opcional para produtos digitais, mas bom ter)
      if (existingItem) {
        toast.info("Item já está no carrinho!");
        return currentItems; // Para produtos digitais, geralmente não queremos duplicados
      }

      toast.success("Produto adicionado ao carrinho!");
      return [...currentItems, { ...product, quantity: 1 }];
    });
  };

  // Remover item
  const removeItem = (productId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId),
    );
    toast.error("Item removido.");
  };

  // Limpar tudo
  const clearCart = () => setItems([]);

  // Cálculos
  const cartTotal = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const cartCount = items.length;

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, cartTotal, cartCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
