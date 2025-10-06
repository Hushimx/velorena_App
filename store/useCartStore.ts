import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
    addToCart,
    clearCart,
    getCartDesigns,
    getCartItems,
    removeCartItem,
    updateCartItem,
    type AddToCartBody,
    type CartItem as ApiCartItem,
    type CartDesign
} from '../utils/api';
import { useAuthStore } from './useAuthStore';

// Local cart item type for compatibility
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
  // API cart item ID for updates/deletes
  cartItemId?: number;
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
  cartDesigns: CartDesign[];
  loading: boolean;
  loadingItems: boolean;
  loadingDesigns: boolean;
  error: string | null;
  // API-based methods
  loadCartItems: () => Promise<void>;
  loadCartDesigns: () => Promise<void>;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
  // Design methods (still local for now)
  addDesign: (design: DesignItem) => void;
  removeDesign: (designId: string) => void;
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

// Helper function to convert API cart item to local cart item
function convertApiCartItemToLocal(apiItem: ApiCartItem): CartItem {
  return {
    id: String(apiItem.product_id),
    name: apiItem.product.name,
    name_ar: apiItem.product.name_ar,
    price: parseFloat(apiItem.unit_price),
    quantity: apiItem.quantity,
    options: apiItem.selected_options,
    cartItemId: apiItem.id,
    // Note: Image will be fetched separately or handled in the UI
    image: (apiItem as any).product?.image_url || (apiItem as any).product?.image || undefined,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      designs: [],
      cartDesigns: [],
      loading: false,
      loadingItems: false,
      loadingDesigns: false,
      error: null,
      
      loadCartItems: async () => {
        const { token, user } = useAuthStore.getState();
        const currentState = get();
        
        // Prevent spam requests - if already loading items, don't make another request
        if (currentState.loadingItems) {
          return;
        }
        
        
        if (!token || !user) {
          set({ items: [], loadingItems: false, error: null });
          return;
        }

        set({ loadingItems: true, error: null });
        
        // Add timeout protection
        const timeoutId = setTimeout(() => {
          set({ loadingItems: false, error: 'تم إلغاء التحميل تلقائياً - حاول مرة أخرى' });
        }, 15000); // 15 second timeout
        
        try {
          const response = await getCartItems();
          clearTimeout(timeoutId);
          
          
          if (response.success && response.data) {
            const localItems = response.data.items.map(convertApiCartItemToLocal);
            set({ items: localItems, loadingItems: false, error: null });
          } else {
            set({ error: 'فشل في تحميل عناصر السلة', loadingItems: false });
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          // Check if it's an authentication error
          if (error.message?.includes('Unauthenticated') || error.message?.includes('401')) {
            set({ items: [], loadingItems: false, error: null });
            // Clear auth state and redirect to login
            useAuthStore.getState().logout();
          } else {
            set({ error: error.message || 'فشل في تحميل عناصر السلة', loadingItems: false });
          }
        }
      },
      
      loadCartDesigns: async () => {
        const { token, user } = useAuthStore.getState();
        const currentState = get();
        
        // Prevent spam requests - if already loading designs, don't make another request
        if (currentState.loadingDesigns) {
          return;
        }
        
        if (!token || !user) {
          set({ cartDesigns: [], loadingDesigns: false, error: null });
          return;
        }

        set({ loadingDesigns: true, error: null });
        
        // Add timeout protection
        const timeoutId = setTimeout(() => {
          set({ loadingDesigns: false, error: 'تم إلغاء التحميل تلقائياً - حاول مرة أخرى' });
        }, 15000); // 15 second timeout
        
        try {
          const response = await getCartDesigns();
          clearTimeout(timeoutId);
          
          
          if (response.success && response.data && Array.isArray(response.data)) {
            set({ cartDesigns: response.data, loadingDesigns: false, error: null });
          } else {
            set({ error: 'فشل في تحميل التصاميم', loadingDesigns: false });
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          // Check if it's an authentication error
          if (error.message?.includes('Unauthenticated') || error.message?.includes('401')) {
            set({ cartDesigns: [], loadingDesigns: false, error: null });
            // Clear auth state and redirect to login
            useAuthStore.getState().logout();
          } else {
            set({ error: error.message || 'فشل في تحميل التصاميم', loadingDesigns: false });
          }
        }
      },
      
      addItem: async (item, quantity = 1) => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ error: 'يجب تسجيل الدخول لإضافة منتجات إلى السلة', loadingItems: false });
          return;
        }

        set({ loadingItems: true, error: null });
        try {
          // Convert local item to API format
          const payload: AddToCartBody = {
            product_id: parseInt(item.id),
            quantity,
            selected_options: item.options,
            notes: item.description || item.description_ar,
          };
          
          const response = await addToCart(payload);
          if (response.success) {
            // Reload cart items to get updated data
            await get().loadCartItems();
            // Also reload cart designs to ensure everything is up to date
            await get().loadCartDesigns();
          } else {
            set({ error: 'Failed to add item to cart', loadingItems: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to add item to cart', loadingItems: false });
        }
      },
      
      removeItem: async (cartItemId) => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ error: 'يجب تسجيل الدخول لإدارة السلة', loadingItems: false });
          return;
        }

        set({ loadingItems: true, error: null });
        try {
          const response = await removeCartItem(cartItemId);
          if (response.success) {
            // Remove item from local state immediately
            set(({ items }) => ({ 
              items: items.filter((i) => i.cartItemId !== cartItemId),
              loadingItems: false 
            }));
          } else {
            set({ error: 'Failed to remove item from cart', loadingItems: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to remove item from cart', loadingItems: false });
        }
      },
      
      updateQuantity: async (cartItemId, quantity) => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ error: 'يجب تسجيل الدخول لإدارة السلة', loadingItems: false });
          return;
        }

        if (quantity <= 0) {
          await get().removeItem(cartItemId);
          return;
        }
        
        set({ loadingItems: true, error: null });
        try {
          const response = await updateCartItem(cartItemId, { quantity });
          if (response.success) {
            // Update local state immediately
            set(({ items }) => ({
              items: items.map((i) => 
                i.cartItemId === cartItemId ? { ...i, quantity } : i
              ),
              loadingItems: false
            }));
          } else {
            set({ error: 'Failed to update cart item', loadingItems: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to update cart item', loadingItems: false });
        }
      },
      
      clear: async () => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ error: 'يجب تسجيل الدخول لإدارة السلة', loadingItems: false });
          return;
        }

        set({ loadingItems: true, error: null });
        try {
          const response = await clearCart();
          if (response.success) {
            set({ items: [], loadingItems: false });
          } else {
            set({ error: 'Failed to clear cart', loadingItems: false });
          }
        } catch (error: any) {
          set({ error: error.message || 'Failed to clear cart', loadingItems: false });
        }
      },
      
      // Design methods (still local for now)
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
      
      removeDesign: (designId) => {
        set(({ designs }) => ({ designs: designs.filter((d) => d.id !== designId) }));
      },
      
      clearDesigns: () => set({ designs: [] }),
      
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ designs: state.designs }), // Only persist designs, not cart items
    }
  )
);

export const buildCartItemKey = (item: { id: string; options?: Record<string, string> }) => buildKey(item);


