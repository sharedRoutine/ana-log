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

const DEFAULT_BG_CLASS = 'bg-gray-500';
const DEFAULT_TEXT_CLASS = 'text-gray-500';

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

  return { getDepartmentClass, getDepartmentTextClass };
}
