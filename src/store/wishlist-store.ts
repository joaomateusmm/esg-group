import { create } from "zustand";
import { persist } from "zustand/middleware";

// Tipo do Item na Wishlist (similar ao CartItem, mas sem quantidade)
export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          // Se já existe, não faz nada (ou poderia remover, estilo toggle)
          if (state.items.some((i) => i.id === newItem.id)) {
            return state;
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (id) => {
        return get().items.some((i) => i.id === id);
      },
    }),
    {
      name: "ESG-Group-wishlist-storage",
    },
  ),
);
