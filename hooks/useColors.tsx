import { DEPARTMENT_OPTIONS } from '~/lib/options';

const DEPARTMENT_COLORS: Record<(typeof DEPARTMENT_OPTIONS)[number], string> = {
  TC: '#EF4444',
  NC: '#3B82F6',
  AC: '#10B981',
  GC: '#8B5CF6',
  HNO: '#F59E0B',
  HG: '#DC2626',
  DE: '#6B7280',
  PC: '#EC4899',
  UC: '#14B8A6',
  URO: '#F97316',
  GYN: '#8B5CF6',
  MKG: '#06B6D4',
  RAD: '#84CC16',
  NRAD: '#F59E0B',
  PSY: '#EF4444',
  AU: '#7C3AED',
  other: '#6B7280',
};

const DEFAULT_COLOR = '#6B7280';

export function useColors() {
  const getDepartmentColor = (department: string): string => {
    if (department in DEPARTMENT_COLORS) {
      return DEPARTMENT_COLORS[department as keyof typeof DEPARTMENT_COLORS];
    }
    return DEFAULT_COLOR;
  };

  return { getDepartmentColor };
}
