import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type ToastVariant = 'default' | 'destructive' | 'success';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
}

export interface UseToastReturn {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

// Global state để chia sẻ toasts giữa các hook
let globalToasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(globalToasts));
};

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>(globalToasts);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter(listener => listener !== setToasts);
    };
  }, []);

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = uuidv4();
    const newToast = { ...props, id };
    
    globalToasts = [...globalToasts, newToast];
    
    // Giữ tối đa 5 toasts
    if (globalToasts.length > 5) {
      globalToasts = globalToasts.slice(1);
    }
    
    notifyListeners();

    // Auto-dismiss sau 5 giây
    setTimeout(() => {
      dismiss(id);
    }, 5000);
  }, []);

  const dismiss = useCallback((id: string) => {
    globalToasts = globalToasts.filter(t => t.id !== id);
    notifyListeners();
  }, []);

  return { toasts, toast, dismiss };
};
