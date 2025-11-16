import { useState, useCallback } from 'react';

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string) => {
    if (!navigator.clipboard) {
      console.error('Clipboard API not available');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Failed to copy text: ', error);
      setIsCopied(false);
      return false;
    }
  }, []);

  return { copyToClipboard, isCopied };
}