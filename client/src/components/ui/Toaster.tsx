
import React, { useState, useEffect } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// Create a global toast object
const toastManager = {
  toasts: [] as Toast[],
  listeners: [] as ((toasts: Toast[]) => void)[],

  addToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };
    this.toasts = [...this.toasts, newToast];
    this.notifyListeners();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
    
    return id;
  },
  
  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  },
  
  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  notifyListeners() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }
};

// Export toast methods
export const toast = {
  success: (message: string) => toastManager.addToast(message, 'success'),
  error: (message: string) => toastManager.addToast(message, 'error'),
  info: (message: string) => toastManager.addToast(message, 'info')
};

export const Toaster: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    return toastManager.subscribe(newToasts => {
      setToasts(newToasts);
    });
  }, []);
  
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`py-3 px-4 rounded-lg shadow-lg max-w-sm animate-slide-in flex items-center justify-between ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border-l-4 border-green-500' :
            toast.type === 'error' ? 'bg-red-50 text-red-800 border-l-4 border-red-500' :
            'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => toastManager.removeToast(toast.id)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
};
