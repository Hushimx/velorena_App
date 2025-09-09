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

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
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
      removeItem: (key) => {
        set(({ items }) => ({ items: items.filter((i) => buildKey(i) !== key) }));
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
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ items: state.items }),
      
    }
  )
);

export const buildCartItemKey = (item: { id: string; options?: Record<string, string> }) => buildKey(item);


