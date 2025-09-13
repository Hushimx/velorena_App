import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CartItem = {
  id: string; // product id
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  image?: string;
  price: number;
  quantity: number;
  // Selected options summarized to build uniqueness key
  options?: Record<string, string>;
};

export type DesignItem = {
  id: string; // design id
  title: string;
  description?: string;
  image_url: string;
  category: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

type CartState = {
  items: CartItem[];
  designs: DesignItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  addDesign: (design: DesignItem) => void;
  removeItem: (key: string) => void;
  removeDesign: (designId: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  clearDesigns: () => void;
  total: () => number;
};

function buildKey(base: { id: string; options?: Record<string, string> }): string {
  const optionsKey = base.options
    ? Object.keys(base.options)
        .sort()
        .map((k) => `${k}:${base.options![k]}`)
        .join('|')
    : '';
  return `${base.id}__${optionsKey}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      designs: [],
      addItem: (item, quantity = 1) => {
        const key = buildKey(item);
        set(({ items }) => {
          const existingIndex = items.findIndex((i) => buildKey(i) === key);
          if (existingIndex !== -1) {
            const next = [...items];
            next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + quantity };
            return { items: next };
          }
          const newItems = [...items, { ...item, quantity }];
          return { items: newItems };
        });
      },
      addDesign: (design) => {
        set(({ designs }) => {
          // Check if design already exists
          const existingIndex = designs.findIndex((d) => d.id === design.id);
          if (existingIndex !== -1) {
            // Replace existing design
            const next = [...designs];
            next[existingIndex] = design;
            return { designs: next };
          }
          // Add new design
          return { designs: [...designs, design] };
        });
      },
      removeItem: (key) => {
        set(({ items }) => ({ items: items.filter((i) => buildKey(i) !== key) }));
      },
      removeDesign: (designId) => {
        set(({ designs }) => ({ designs: designs.filter((d) => d.id !== designId) }));
      },
      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          set(({ items }) => ({ items: items.filter((i) => buildKey(i) !== key) }));
          return;
        }
        set(({ items }) => ({
          items: items.map((i) => (buildKey(i) === key ? { ...i, quantity } : i)),
        }));
      },
      clear: () => set({ items: [] }),
      clearDesigns: () => set({ designs: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items, designs: state.designs }),
      
    }
  )
);

export const buildCartItemKey = (item: { id: string; options?: Record<string, string> }) => buildKey(item);


