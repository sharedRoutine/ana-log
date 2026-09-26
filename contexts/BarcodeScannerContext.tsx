import { createContext, ReactNode, useContext, useState } from 'react';

type OnScan = (caseNumber: string) => void;

type BarcodeScannerContextType = {
  onScan: OnScan | null;
  setOnScan: (callback: OnScan | null) => void;
};

const BarcodeScannerContext = createContext<BarcodeScannerContextType | null>(
  null,
);

export function BarcodeScannerProvider({ children }: { children: ReactNode }) {
  const [onScan, setOnScanState] = useState<OnScan | null>(null);

  const setOnScan = (callback: OnScan | null) => {
    setOnScanState(() => callback);
  };

  return (
    <BarcodeScannerContext.Provider value={{ onScan, setOnScan }}>
      {children}
    </BarcodeScannerContext.Provider>
  );
}

export function useBarcodeScanner() {
  const context = useContext(BarcodeScannerContext);
  if (!context) {
    throw new Error(
      'useBarcodeScanner must be used within a BarcodeScannerProvider',
    );
  }
  return context;
}
