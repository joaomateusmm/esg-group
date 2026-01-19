import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipo do Produto no Carrinho (baseado no seu Schema do Drizzle)
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  category?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, action: "increase" | "decrease") => void;
  clearCart: () => void;

  // Getters computados (auxiliares)
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === newItem.id);

          // Se já existe, aumenta a quantidade
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }

          // Se não existe, adiciona novo
          return { items: [...state.items, { ...newItem, quantity: 1 }] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, action) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === id) {
              const newQuantity =
                action === "increase" ? i.quantity + 1 : i.quantity - 1;
              // Não permite menos que 1 (use removeItem para remover)
              return { ...i, quantity: Math.max(1, newQuantity) };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },
    }),
    {
      name: "ESG-Group-cart-storage", // Nome da chave no LocalStorage
    },
  ),
);
