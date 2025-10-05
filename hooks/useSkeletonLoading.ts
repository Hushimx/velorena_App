import { useEffect, useState } from 'react';

interface UseSkeletonLoadingOptions {
  isLoading: boolean;
  minimumDisplayTime?: number; // in milliseconds
}

/**
 * Custom hook to manage skeleton loading with minimum display time
 * Prevents jarring flash when content loads too quickly
 */
export const useSkeletonLoading = ({ 
  isLoading, 
  minimumDisplayTime = 800 
}: UseSkeletonLoadingOptions) => {
  const [showSkeleton, setShowSkeleton] = useState(isLoading);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start loading - show skeleton immediately
      setShowSkeleton(true);
      setStartTime(Date.now());
    } else if (startTime !== null) {
      // Loading finished - check if minimum time has passed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = minimumDisplayTime - elapsedTime;

      if (remainingTime > 0) {
        // Wait for remaining time before hiding skeleton
        const timer = setTimeout(() => {
          setShowSkeleton(false);
          setStartTime(null);
        }, remainingTime);

        return () => clearTimeout(timer);
      } else {
        // Minimum time already passed - hide skeleton immediately
        setShowSkeleton(false);
        setStartTime(null);
      }
    }
  }, [isLoading, minimumDisplayTime]); // Removed startTime from dependencies to prevent infinite loop

  return showSkeleton;
};
