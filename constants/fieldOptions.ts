export const DEPARTMENT_OPTIONS = [
  'TC', 'NC', 'AC', 'GC', 'HNO', 'HG', 'DE', 'PC', 'UC', 'URO', 'GYN', 'MKG', 'RAD', 'NRAD', 'other'
];

export const AIRWAY_OPTIONS = [
  'tubus', 'lama', 'trachealkanüle', 'maske', 'spontan', 'koniotomie'
];

export const getFieldOptions = (intl: any) => [
  { value: 'caseNumber', label: intl.formatMessage({ id: 'create-filter.field.case-number' }) },
  { value: 'department', label: intl.formatMessage({ id: 'create-filter.field.department' }) },
  { value: 'asaScore', label: intl.formatMessage({ id: 'create-filter.field.asa-score' }) },
  { value: 'airwayManagement', label: intl.formatMessage({ id: 'create-filter.field.airway-management' }) },
  { value: 'isOutpatient', label: intl.formatMessage({ id: 'create-filter.field.outpatient' }) },
  { value: 'hasSpecialFeatures', label: intl.formatMessage({ id: 'create-filter.field.special-features' }) },
  { value: 'hasRegionalAnesthesia', label: intl.formatMessage({ id: 'create-filter.field.regional-anesthesia' }) },
  { value: 'procedure', label: intl.formatMessage({ id: 'create-filter.field.procedure' }) },
];

export const getOperatorOptions = (intl: any) => [
  { value: 'equals', label: intl.formatMessage({ id: 'create-filter.operator.equals' }) },
  { value: 'contains', label: intl.formatMessage({ id: 'create-filter.operator.contains' }) },
  { value: 'greater_than', label: intl.formatMessage({ id: 'create-filter.operator.greater-than' }) },
  { value: 'less_than', label: intl.formatMessage({ id: 'create-filter.operator.less-than' }) },
  { value: 'is_true', label: intl.formatMessage({ id: 'create-filter.operator.is-true' }) },
  { value: 'is_false', label: intl.formatMessage({ id: 'create-filter.operator.is-false' }) },
];

export const getAvailableOperators = (field: string) => {
  switch (field) {
    case 'caseNumber':
    case 'procedure':
      return ['equals', 'contains'];
    case 'department':
    case 'airwayManagement':
      return ['equals'];
    case 'asaScore':
      return ['equals', 'greater_than', 'less_than'];
    case 'isOutpatient':
    case 'hasSpecialFeatures':
    case 'hasRegionalAnesthesia':
      return ['is_true', 'is_false'];
    default:
      return ['equals', 'contains'];
  }
};

export const getInputTypeForField = (field: string, operator: string) => {
  if (operator === 'is_true' || operator === 'is_false') {
    return 'none';
  }
  
  switch (field) {
    case 'asaScore':
      return 'number';
    case 'department':
      return 'select-department';
    case 'airwayManagement':
      return 'select-airway';
    case 'isOutpatient':
    case 'hasSpecialFeatures':
    case 'hasRegionalAnesthesia':
      return 'boolean';
    default:
      return 'text';
  }
};