import { DEPARTMENT_OPTIONS } from '~/lib/options';

const DEPARTMENT_CLASSES: Record<(typeof DEPARTMENT_OPTIONS)[number], string> =
  {
    TC: 'bg-red-500',
    NC: 'bg-blue-500',
    AC: 'bg-emerald-500',
    GC: 'bg-violet-500',
    HNO: 'bg-amber-500',
    HG: 'bg-red-600',
    DE: 'bg-gray-500',
    PC: 'bg-pink-500',
    UC: 'bg-teal-500',
    URO: 'bg-orange-500',
    GYN: 'bg-violet-500',
    MKG: 'bg-cyan-500',
    RAD: 'bg-lime-500',
    NRAD: 'bg-amber-500',
    PSY: 'bg-red-500',
    AU: 'bg-violet-600',
    other: 'bg-gray-500',
  };

const DEFAULT_CLASS = 'bg-gray-500';

export function useColors() {
  const getDepartmentClass = (department: string): string => {
    if (department in DEPARTMENT_CLASSES) {
      return DEPARTMENT_CLASSES[department as keyof typeof DEPARTMENT_CLASSES];
    }
    return DEFAULT_CLASS;
  };

  return { getDepartmentClass };
}
