import { DEPARTMENT_OPTIONS } from '~/lib/options';

const DEPARTMENT_BG_CLASSES: Record<
  (typeof DEPARTMENT_OPTIONS)[number],
  string
> = {
  TC: 'bg-red-500',
  NC: 'bg-blue-500',
  AC: 'bg-indigo-500',
  GC: 'bg-violet-500',
  HNO: 'bg-amber-500',
  HG: 'bg-red-600',
  DE: 'bg-gray-500',
  PC: 'bg-pink-500',
  UC: 'bg-teal-500',
  URO: 'bg-orange-500',
  GYN: 'bg-purple-500',
  MKG: 'bg-cyan-500',
  RAD: 'bg-lime-500',
  NRAD: 'bg-yellow-500',
  PSY: 'bg-rose-500',
  AU: 'bg-violet-600',
  other: 'bg-gray-500',
};

const DEPARTMENT_TEXT_CLASSES: Record<
  (typeof DEPARTMENT_OPTIONS)[number],
  string
> = {
  TC: 'text-red-500',
  NC: 'text-blue-500',
  AC: 'text-indigo-500',
  GC: 'text-violet-500',
  HNO: 'text-amber-500',
  HG: 'text-red-600',
  DE: 'text-gray-500',
  PC: 'text-pink-500',
  UC: 'text-teal-500',
  URO: 'text-orange-500',
  GYN: 'text-purple-500',
  MKG: 'text-cyan-500',
  RAD: 'text-lime-500',
  NRAD: 'text-yellow-500',
  PSY: 'text-rose-500',
  AU: 'text-violet-600',
  other: 'text-gray-500',
};

const DEPARTMENT_HEX_COLORS: Record<
  (typeof DEPARTMENT_OPTIONS)[number],
  string
> = {
  TC: '#EF4444',
  NC: '#3B82F6',
  AC: '#6366F1',
  GC: '#8B5CF6',
  HNO: '#F59E0B',
  HG: '#DC2626',
  DE: '#6B7280',
  PC: '#EC4899',
  UC: '#14B8A6',
  URO: '#F97316',
  GYN: '#A855F7',
  MKG: '#06B6D4',
  RAD: '#84CC16',
  NRAD: '#EAB308',
  PSY: '#F43F5E',
  AU: '#7C3AED',
  other: '#6B7280',
};

const DEFAULT_BG_CLASS = 'bg-gray-500';
const DEFAULT_TEXT_CLASS = 'text-gray-500';
const DEFAULT_HEX_COLOR = '#6B7280';

const getDepartmentRowBackground = (
  _department: string,
  isDark: boolean,
): string => {
  const r = parseInt(DEFAULT_HEX_COLOR.slice(1, 3), 16);
  const g = parseInt(DEFAULT_HEX_COLOR.slice(3, 5), 16);
  const b = parseInt(DEFAULT_HEX_COLOR.slice(5, 7), 16);
  const opacity = isDark ? 0.15 : 0.1;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function useColors() {
  const getDepartmentClass = (department: string): string => {
    if (department in DEPARTMENT_BG_CLASSES) {
      return DEPARTMENT_BG_CLASSES[
        department as keyof typeof DEPARTMENT_BG_CLASSES
      ];
    }
    return DEFAULT_BG_CLASS;
  };

  const getDepartmentTextClass = (department: string): string => {
    if (department in DEPARTMENT_TEXT_CLASSES) {
      return DEPARTMENT_TEXT_CLASSES[
        department as keyof typeof DEPARTMENT_TEXT_CLASSES
      ];
    }
    return DEFAULT_TEXT_CLASS;
  };

  const getDepartmentHexColor = (department: string): string => {
    if (department in DEPARTMENT_HEX_COLORS) {
      return DEPARTMENT_HEX_COLORS[
        department as keyof typeof DEPARTMENT_HEX_COLORS
      ];
    }
    return DEFAULT_HEX_COLOR;
  };

  return {
    getDepartmentClass,
    getDepartmentTextClass,
    getDepartmentHexColor,
    getDepartmentRowBackground,
  };
}
