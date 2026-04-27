import { createContext } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

export interface ToastContextValue {
  toasts: ToastMessage[];
  push: (text: string, tone?: ToastMessage['tone']) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
