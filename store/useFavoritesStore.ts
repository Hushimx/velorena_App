import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  getFavoriteIds,
  type FavoriteProduct,
} from '../utils/api';
import { useAuthStore } from './useAuthStore';

export type FavoriteItem = {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    name_ar?: string;
    slug?: string;
    description?: string;
    description_ar?: string;
    price: number;
    image_url?: string;
    category_id?: number;
    is_active?: boolean;
  };
  favorited_at: string;
};

type FavoritesState = {
  favorites: FavoriteItem[];
  favoriteIds: Set<number>;
  loading: boolean;
  error: string | null;
  
  // API methods
  loadFavorites: () => Promise<void>;
  loadFavoriteIds: () => Promise<void>;
  addToFavorites: (productId: number) => Promise<boolean>;
  removeFromFavorites: (productId: number) => Promise<boolean>;
  toggleFavoriteStatus: (productId: number) => Promise<boolean>;
  isFavorite: (productId: number) => boolean;
  clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      favoriteIds: new Set<number>(),
      loading: false,
      error: null,

      /**
       * Load all favorites from API
       */
      loadFavorites: async () => {
        const { token } = useAuthStore.getState();
        console.log('🔍 loadFavorites: token exists?', !!token);
        
        if (!token) {
          console.log('❌ No token found, cannot load favorites');
          set({ favorites: [], favoriteIds: new Set(), error: 'Not authenticated' });
          return;
        }

        set({ loading: true, error: null });
        console.log('📡 Calling getFavorites API...');

        try {
          const response = await getFavorites();
          console.log('✅ getFavorites response:', response);
          
          if (response.success && response.data) {
            const favoriteItems = response.data as FavoriteItem[];
            const ids = new Set(favoriteItems.map((item) => item.product_id));
            
            console.log('✅ Loaded favorites:', favoriteItems.length, 'items');
            
            set({
              favorites: favoriteItems,
              favoriteIds: ids,
              loading: false,
            });
          } else {
            throw new Error(response.message || 'Failed to load favorites');
          }
        } catch (error: any) {
          console.error('❌ Error loading favorites:', error);
          set({
            error: error.message || 'Failed to load favorites',
            loading: false,
          });
        }
      },

      /**
       * Load only favorite product IDs (lighter request)
       */
      loadFavoriteIds: async () => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ favoriteIds: new Set(), error: 'Not authenticated' });
          return;
        }

        try {
          const response = await getFavoriteIds();
          
          if (response.success && response.data) {
            const ids = new Set(response.data as number[]);
            set({ favoriteIds: ids });
          }
        } catch (error: any) {
          console.error('Error loading favorite IDs:', error);
        }
      },

      /**
       * Add a product to favorites
       */
      addToFavorites: async (productId: number): Promise<boolean> => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ error: 'Not authenticated' });
          return false;
        }

        set({ loading: true, error: null });

        try {
          const response = await addFavorite(productId);

          if (response.success) {
            // Optimistically update the state
            const currentIds = get().favoriteIds;
            const newIds = new Set(currentIds);
            newIds.add(productId);
            
            set({
              favoriteIds: newIds,
              loading: false,
            });

            // Reload full favorites list in the background
            get().loadFavorites();
            
            return true;
          } else {
            throw new Error(response.message || 'Failed to add to favorites');
          }
        } catch (error: any) {
          console.error('Error adding to favorites:', error);
          set({
            error: error.message || 'Failed to add to favorites',
            loading: false,
          });
          return false;
        }
      },

      /**
       * Remove a product from favorites
       */
      removeFromFavorites: async (productId: number): Promise<boolean> => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ error: 'Not authenticated' });
          return false;
        }

        set({ loading: true, error: null });

        try {
          const response = await removeFavorite(productId);

          if (response.success) {
            // Optimistically update the state
            const currentIds = get().favoriteIds;
            const newIds = new Set(currentIds);
            newIds.delete(productId);
            
            const currentFavorites = get().favorites;
            const newFavorites = currentFavorites.filter(
              (item) => item.product_id !== productId
            );
            
            set({
              favoriteIds: newIds,
              favorites: newFavorites,
              loading: false,
            });
            
            return true;
          } else {
            throw new Error(response.message || 'Failed to remove from favorites');
          }
        } catch (error: any) {
          console.error('Error removing from favorites:', error);
          set({
            error: error.message || 'Failed to remove from favorites',
            loading: false,
          });
          return false;
        }
      },

      /**
       * Toggle favorite status (add if not favorited, remove if favorited)
       */
      toggleFavoriteStatus: async (productId: number): Promise<boolean> => {
        const { token } = useAuthStore.getState();
        if (!token) {
          set({ error: 'Not authenticated' });
          return false;
        }

        set({ loading: true, error: null });

        try {
          const response = await toggleFavorite(productId);

          if (response.success && response.data) {
            const isFavorited = response.data.is_favorited;
            
            // Update the state based on the response
            const currentIds = get().favoriteIds;
            const newIds = new Set(currentIds);
            
            if (isFavorited) {
              newIds.add(productId);
            } else {
              newIds.delete(productId);
              
              // Also remove from favorites list
              const currentFavorites = get().favorites;
              const newFavorites = currentFavorites.filter(
                (item) => item.product_id !== productId
              );
              set({ favorites: newFavorites });
            }
            
            set({
              favoriteIds: newIds,
              loading: false,
            });

            // Reload full favorites list in the background if added
            if (isFavorited) {
              get().loadFavorites();
            }
            
            return isFavorited;
          } else {
            throw new Error(response.message || 'Failed to toggle favorite');
          }
        } catch (error: any) {
          console.error('Error toggling favorite:', error);
          set({
            error: error.message || 'Failed to toggle favorite',
            loading: false,
          });
          return false;
        }
      },

      /**
       * Check if a product is favorited
       */
      isFavorite: (productId: number): boolean => {
        return get().favoriteIds.has(productId);
      },

      /**
       * Clear all favorites (local only, does not sync with API)
       */
      clearFavorites: () => {
        set({
          favorites: [],
          favoriteIds: new Set(),
          error: null,
        });
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist favoriteIds for quick access
      partialize: (state) => ({
        favoriteIds: Array.from(state.favoriteIds),
      }),
      // Custom merge to handle Set serialization
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        favoriteIds: new Set(persistedState?.favoriteIds || []),
      }),
    }
  )
);
