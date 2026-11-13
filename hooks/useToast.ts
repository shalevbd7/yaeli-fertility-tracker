"use client";

import { useCallback, useState } from 'react';
import type { Toast } from '@/lib/tracker/types';

// Toast notification state. `showToast` is stable across renders.
export function useToast() {
  const [toast, setToast] = useState<Toast>(null);

  const showToast = useCallback((message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  return { toast, showToast };
}
