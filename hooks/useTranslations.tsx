import { useIntl } from 'react-intl';

export function useTranslations() {
  const intl = useIntl();

  const translateDepartment = (department: string) => {
    return intl.formatMessage({ id: `enum.department.${department}` });
  };

  const translateAirwayManagement = (airway: string) => {
    return intl.formatMessage({ id: `enum.airway-management.${airway}` });
  };

  const translateField = (field: string) => {
    return intl.formatMessage({ id: `create-filter.field.${field}` });
  };

  const translateOperator = (operator: string) => {
    return intl.formatMessage({ id: `create-filter.operator.${operator}` });
  };

  return {
    intl,
    translateDepartment,
    translateAirwayManagement,
    translateField,
    translateOperator,
  };
}
