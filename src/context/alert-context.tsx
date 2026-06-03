import React, { createContext, useState, useCallback } from 'react';

export type AlertVariant = 'success' | 'destructive' | 'info' | 'warning';

export interface AlertData {
  title: string;
  desc?: string;
  variant: AlertVariant;
  duration?: number;
}

interface AlertContextType {
  alert: AlertData | null;
  showAlert: (data: AlertData) => void;
  hideAlert: () => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<AlertData | null>(null);

  const showAlert = useCallback((data: AlertData) => {
    setAlert(data);
    const duration = data.duration ?? 3000;
    setTimeout(() => {
      setAlert(null);
    }, duration);
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(null);
  }, []);

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
      {/* Toast Alert component can be rendered here */}
    </AlertContext.Provider>
  );
};
