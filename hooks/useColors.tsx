import { DEPARTMENT_OPTIONS } from '~/lib/options';

export function useColors() {
  const getDepartmentColor = (department: string) => {
    const colors: string[] = [
      '#EF4444',
      '#3B82F6',
      '#10B981',
      '#8B5CF6',
      '#F59E0B',
      '#DC2626',
      '#6B7280',
      '#EC4899',
      '#14B8A6',
      '#F97316',
      '#8B5CF6',
      '#06B6D4',
      '#84CC16',
      '#F59E0B',
      '#EF4444',
      '#6B7280',
    ];
    const index = DEPARTMENT_OPTIONS.indexOf(department as any);
    return colors[index] || '#6B7280';
  };

  return { getDepartmentColor };
}