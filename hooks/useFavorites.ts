import { useEffect, useState } from 'react';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useIsAuthenticated } from '../store/useAuthStore';

/**
 * Hook to manage favorites
 * Automatically loads favorites when user is authenticated
 */
export function useFavorites() {
  const isAuthenticated = useIsAuthenticated();
  const {
    favorites,
    favoriteIds,
    loading,
    error,
    loadFavorites,
    loadFavoriteIds,
    addToFavorites,
    removeFromFavorites,
    toggleFavoriteStatus,
    isFavorite,
  } = useFavoritesStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Load favorites on mount if authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && !hasLoadedOnce && !loading) {
      console.log('🔄 useFavorites: Loading favorites for the first time');
      loadFavorites().then(() => {
        setHasLoadedOnce(true);
      }).catch((err) => {
        console.error('❌ useFavorites: Failed to load favorites:', err);
      });
    }
  }, [isAuthenticated, hasLoadedOnce, loading]);

  /**
   * Refresh favorites list
   */
  const refresh = async () => {
    if (!isAuthenticated) return;
    
    setIsRefreshing(true);
    try {
      await loadFavorites();
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Add product to favorites
   */
  const addFavorite = async (productId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }
    return await addToFavorites(productId);
  };

  /**
   * Remove product from favorites
   */
  const removeFavorite = async (productId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }
    return await removeFromFavorites(productId);
  };

  /**
   * Toggle favorite status
   */
  const toggleFavorite = async (productId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }
    return await toggleFavoriteStatus(productId);
  };

  return {
    favorites,
    favoriteIds,
    loading,
    error,
    isRefreshing,
    refresh,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    isAuthenticated,
    count: favorites.length,
  };
}

/**
 * Hook to check if a specific product is favorited
 * Useful for product cards and detail pages
 */
export function useIsFavorite(productId: number) {
  const isAuthenticated = useIsAuthenticated();
  const { isFavorite, loading, toggleFavoriteStatus } = useFavoritesStore();
  const [isToggling, setIsToggling] = useState(false);

  const isFavorited = isAuthenticated ? isFavorite(productId) : false;

  const toggle = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    setIsToggling(true);
    try {
      const result = await toggleFavoriteStatus(productId);
      return result;
    } finally {
      setIsToggling(false);
    }
  };

  return {
    isFavorited,
    isToggling,
    loading,
    toggle,
    isAuthenticated,
  };
}
