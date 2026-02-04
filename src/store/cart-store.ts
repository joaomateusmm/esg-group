import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipo do Produto no Carrinho
export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  category?: string;
  currency?: string;
}

// Tipo do Cupom
export interface AppliedCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
}

interface CartState {
  items: CartItem[];
  coupon: AppliedCoupon | null;

  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, action: "increase" | "decrease") => void;
  clearCart: () => void;

  // Actions de Cupom
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;

  // Getters computados
  getTotalItems: () => number;
  getSubtotal: () => number; // Adicionado: Preço sem desconto
  getTotalPrice: () => number; // Atualizado: Preço COM desconto
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (newItem) => {
        set((state) => {
          const existingItem = state.items.find((i) => i.id === newItem.id);

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }

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
              return { ...i, quantity: Math.max(1, newQuantity) };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ items: [], coupon: null }),

      // --- NOVAS FUNÇÕES DE CUPOM ---
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      // --- GETTERS ---
      getTotalItems: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      // Calculates the raw total without coupons
      getSubtotal: () => {
        const { items } = get();
        return items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
      },

      // Calculates the final total WITH coupon applied
      getTotalPrice: () => {
        const { items, coupon } = get();
        const subtotal = items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );

        if (!coupon) return subtotal;

        let discount = 0;
        if (coupon.type === "percent") {
          discount = Math.round(subtotal * (coupon.value / 100));
        } else {
          discount = coupon.value;
        }

        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: "ESG-Group-cart-storage",
      version: 1, // Update version to force clear old state structure if needed
    },
  ),
);
