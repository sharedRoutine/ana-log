import { useCallback } from 'react';
import { useIntl } from 'react-intl';

export function useTranslations() {
  const intl = useIntl();

  const translateDepartment = useCallback(
    (department: string) => {
      return intl.formatMessage({ id: `enum.department.${department}` });
    },
    [intl]
  );

  const translateAirwayManagement = useCallback(
    (airway: string) => {
      return intl.formatMessage({ id: `enum.airway-management.${airway}` });
    },
    [intl]
  );

  const translateField = useCallback(
    (field: string) => {
      return intl.formatMessage({ id: `create-filter.field.${field}` });
    },
    [intl]
  );

  const translateOperator = useCallback(
    (operator: string) => {
      return intl.formatMessage({ id: `create-filter.operator.${operator}` });
    },
    [intl]
  );

  return {
    intl,
    translateDepartment,
    translateAirwayManagement,
    translateField,
    translateOperator,
  };
}
