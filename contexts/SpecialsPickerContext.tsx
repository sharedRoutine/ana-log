import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SPECIALS_OPTIONS } from '~/lib/options';

type SpecialsSelection = Array<(typeof SPECIALS_OPTIONS)[number]>;

type SpecialsPickerContextType = {
  selection: SpecialsSelection;
  setSelection: (selection: SpecialsSelection) => void;
  onSelectionComplete: ((selection: SpecialsSelection) => void) | null;
  setOnSelectionComplete: (callback: ((selection: SpecialsSelection) => void) | null) => void;
};

const SpecialsPickerContext = createContext<SpecialsPickerContextType | null>(null);

export function SpecialsPickerProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<SpecialsSelection>([]);
  const [onSelectionComplete, setOnSelectionComplete] = useState<
    ((selection: SpecialsSelection) => void) | null
  >(null);

  const setCallback = useCallback((callback: ((selection: SpecialsSelection) => void) | null) => {
    setOnSelectionComplete(() => callback);
  }, []);

  return (
    <SpecialsPickerContext.Provider
      value={{
        selection,
        setSelection,
        onSelectionComplete,
        setOnSelectionComplete: setCallback,
      }}>
      {children}
    </SpecialsPickerContext.Provider>
  );
}

export function useSpecialsPicker() {
  const context = useContext(SpecialsPickerContext);
  if (!context) {
    throw new Error('useSpecialsPicker must be used within a SpecialsPickerProvider');
  }
  return context;
}
