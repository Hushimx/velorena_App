import { useRef, useState } from 'react';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useIsAuthenticated } from '../store/useAuthStore';

interface UseAuthPromptReturn {
  authBottomSheetRef: React.RefObject<BottomSheetModal | null>;
  customMessage?: string;
  promptForAuth: (message?: string) => void;
  hideAuthPrompt: () => void;
  checkAuthAndPrompt: (callback: () => void, message?: string) => void;
}

export function useAuthPrompt(): UseAuthPromptReturn {
  const authBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const [customMessage, setCustomMessage] = useState<string | undefined>();
  const isAuthenticated = useIsAuthenticated();

  const promptForAuth = (message?: string) => {
    setCustomMessage(message);
    authBottomSheetRef.current?.present();
  };

  const hideAuthPrompt = () => {
    authBottomSheetRef.current?.dismiss();
    setCustomMessage(undefined);
  };

  const checkAuthAndPrompt = (callback: () => void, message?: string) => {
    if (isAuthenticated) {
      callback();
    } else {
      promptForAuth(message);
    }
  };

  return {
    authBottomSheetRef,
    customMessage,
    promptForAuth,
    hideAuthPrompt,
    checkAuthAndPrompt,
  };
}
