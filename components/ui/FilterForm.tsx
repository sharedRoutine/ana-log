import { useForm, useStore } from '@tanstack/react-form';
import { Match } from 'effect';
import { Plus, Trash2 } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { Alert, Keyboard, Text, View } from 'react-native';
import { useColors } from '~/hooks/useColors';
import {
  FIELDS,
  Filter,
  BooleanCondition,
  FilterCondition,
} from '~/lib/condition';
import {
  ACCENT,
  FormButtonRow,
  FormChipSelect,
  FormRow,
  FormScrollView,
  FormSection,
  FormSegmented,
  FormStepperRow,
  FormSwitchRow,
  FormTextField,
} from './Form';

// TODO: Better errors
const validateForm = (value: typeof Filter.Type & { hasGoal: boolean }) => {
  if (!value.name) {
    return 'No name';
  }
  if (value.hasGoal) {
    if (typeof value.goal !== 'number' || isNaN(value.goal)) {
      return 'Invalid goal value';
    }
  }
  if (value.conditions.length === 0) {
    return 'At least one condition required';
  }
  for (const condition of value.conditions) {
    const returnVal = Match.value(condition).pipe(
      Match.tag('TEXT_CONDITION', (textCondition) => {
        if (!textCondition.field) {
          return 'Missing field';
        }
        if (
          typeof textCondition.value !== 'string' ||
          !textCondition.value.trim()
        ) {
          return 'Empty value in condition';
        }
      }),
      Match.tag('NUMBER_CONDITION', (numberCondition) => {
        if (!numberCondition.field) {
          return 'Missing field';
        }
        if (
          typeof numberCondition.value !== 'number' ||
          isNaN(numberCondition.value)
        ) {
          return 'Invalid number in condition';
        }
      }),
      Match.tag('BOOLEAN_CONDITION', (booleanCondition) => {
        if (!booleanCondition.field) {
          return 'Missing field';
        }
      }),
      Match.tag('ENUM_CONDITION', (enumCondition) => {
        if (!enumCondition.field) {
          return 'Missing field';
        }
        if (!enumCondition.options.includes(enumCondition.value)) {
          return 'Invalid enum value in condition';
        }
      }),
      Match.exhaustive,
    );
    if (returnVal) {
      return returnVal;
    }
  }
};

type FilterFormProps = {
  filter: typeof Filter.Type;
  hasGoal: boolean;
  isEditing?: boolean;
  onSubmit?: (
    value: typeof Filter.Type & { hasGoal: boolean },
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
  children?: ({
    canSubmit,
    dismiss,
    save,
  }: {
    canSubmit: boolean;
    dismiss: () => void;
    save: () => void;
  }) => React.ReactNode;
};

export default function FilterForm({
  filter,
  hasGoal,
  isEditing,
  onDelete,
  onSubmit,
  children,
}: FilterFormProps) {
  const intl = useIntl();
  const { getDepartmentHexColor } = useColors();

  const form = useForm({
    defaultValues: {
      ...filter,
      hasGoal,
    },
    validators: {
      onMount: ({ value }) => validateForm(value),
      onChange: ({ value }) => validateForm(value),
      onBlur: ({ value }) => validateForm(value),
    },
    onSubmit: async ({ value }) => {
      Keyboard.dismiss();
      await onSubmit?.(value);
      form.reset();
    },
  });

  const FieldsWithName = FIELDS.map(({ field }) => ({
    label: intl.formatMessage({ id: `create-filter.field.${field}` }),
    value: field,
  })).sort((a, b) => a.label.localeCompare(b.label));

  const hasGoalValue = useStore(form.store, (state) => state.values.hasGoal);
  const conditions = useStore(form.store, (state) => state.values.conditions);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const dismiss = () => Keyboard.dismiss();
  const save = () => form.handleSubmit();

  const handleDelete = () => {
    Alert.alert(
      intl.formatMessage({ id: 'edit-filter.delete.confirm.title' }),
      intl.formatMessage({ id: 'edit-filter.delete.confirm.message' }),
      [
        {
          text: intl.formatMessage({ id: 'edit-filter.delete.confirm.cancel' }),
          style: 'cancel',
        },
        {
          text: intl.formatMessage({ id: 'edit-filter.delete.confirm.delete' }),
          style: 'destructive',
          onPress: () => onDelete?.(),
        },
      ],
    );
  };

  const yesNoOptions = [
    { label: intl.formatMessage({ id: 'create-filter.yes' }), value: true },
    { label: intl.formatMessage({ id: 'create-filter.no' }), value: false },
  ];

  return (
    <>
      {children
        ? children({
            canSubmit: canSubmit && !isSubmitting,
            dismiss,
            save,
          })
        : null}
      <FormScrollView>
        <FormSection
          title={intl.formatMessage({ id: 'create-filter.filter-details' })}
        >
          <form.Field name="name">
            {({ state, handleChange }) => (
              <FormTextField
                placeholder={intl.formatMessage({
                  id: 'create-filter.filter-name.placeholder',
                })}
                defaultValue={state.value}
                onChangeText={(text) => handleChange(text)}
                autoCorrect={false}
              />
            )}
          </form.Field>
          <form.Field name="hasGoal">
            {({ state, handleChange }) => (
              <FormSwitchRow
                label={intl.formatMessage({ id: 'create-filter.goal' })}
                value={state.value}
                onValueChange={(checked) => {
                  handleChange(checked);

                  if (!checked) {
                    form.setFieldValue('goal', undefined);
                  }
                }}
              />
            )}
          </form.Field>
          {hasGoalValue && (
            <form.Field name="goal">
              {({ state, handleChange }) => (
                <FormStepperRow
                  label={intl.formatMessage({ id: 'create-filter.goal-value' })}
                  value={state.value ?? 0}
                  min={0}
                  max={1000}
                  onChange={(value) => handleChange(value)}
                />
              )}
            </form.Field>
          )}
        </FormSection>
        {conditions.length > 1 && (
          <FormSection
            title={intl.formatMessage({ id: 'create-filter.combinator' })}
          >
            <form.Field name="combinator">
              {({ state, handleChange }) => (
                <FormRow>
                  <FormSegmented
                    options={[
                      {
                        label: intl.formatMessage({
                          id: 'create-filter.combinator.AND',
                        }),
                        value: 'AND' as const,
                      },
                      {
                        label: intl.formatMessage({
                          id: 'create-filter.combinator.OR',
                        }),
                        value: 'OR' as const,
                      },
                    ]}
                    value={state.value ?? 'AND'}
                    onChange={(value) => handleChange(value)}
                  />
                </FormRow>
              )}
            </form.Field>
          </FormSection>
        )}
        <form.Field name="conditions" mode="array">
          {(field) => (
            <>
              {field.state.value.map((_, i) => {
                const value = field.form.getFieldValue(`conditions[${i}]`);

                return (
                  <FormSection
                    key={`condition-${i}`}
                    title={intl.formatMessage(
                      { id: 'create-filter.condition' },
                      { index: i + 1 },
                    )}
                    accessory={
                      conditions.length > 1 ? (
                        <PressableScale
                          onPress={() => field.removeValue(i)}
                          accessibilityRole="button"
                          accessibilityLabel={intl.formatMessage({
                            id: 'create-filter.remove',
                          })}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </PressableScale>
                      ) : undefined
                    }
                  >
                    <form.Field name={`conditions[${i}]`}>
                      {(conditionField) => (
                        <form.Field name={`conditions[${i}].field`}>
                          {(subField) => (
                            <FormRow
                              stacked
                              label={intl.formatMessage({
                                id: 'create-filter.field',
                              })}
                            >
                              <FormChipSelect
                                options={FieldsWithName}
                                value={subField.state.value}
                                onChange={(fieldName) => {
                                  const condition = FIELDS.find(
                                    (f) => f.field === fieldName,
                                  );
                                  if (condition) {
                                    conditionField.handleChange(condition);
                                  }
                                  subField.handleChange(fieldName);
                                }}
                              />
                            </FormRow>
                          )}
                        </form.Field>
                      )}
                    </form.Field>
                    {value.field
                      ? Match.value(value).pipe(
                          Match.tag('TEXT_CONDITION', (textCondition) => (
                            <form.Field name={`conditions[${i}].operator`}>
                              {(operatorField) => (
                                <FormRow
                                  label={intl.formatMessage({
                                    id: 'create-filter.operator',
                                  })}
                                >
                                  <FormSegmented
                                    options={Array.from(
                                      textCondition.operators,
                                    ).map((op) => ({
                                      label: intl.formatMessage({
                                        id: `create-filter.operator.${op}`,
                                      }),
                                      value: op,
                                    }))}
                                    value={operatorField.state.value}
                                    onChange={(op) =>
                                      operatorField.handleChange(op)
                                    }
                                  />
                                </FormRow>
                              )}
                            </form.Field>
                          )),
                          Match.tag('NUMBER_CONDITION', (numberCondition) => (
                            <form.Field name={`conditions[${i}].operator`}>
                              {(operatorField) => (
                                <FormRow
                                  label={intl.formatMessage({
                                    id: 'create-filter.operator',
                                  })}
                                >
                                  <FormSegmented
                                    options={Array.from(
                                      numberCondition.operators,
                                    ).map((op) => ({
                                      label: intl.formatMessage({
                                        id: `create-filter.operator.${op}`,
                                      }),
                                      value: op,
                                    }))}
                                    value={operatorField.state.value}
                                    onChange={(op) =>
                                      operatorField.handleChange(op)
                                    }
                                  />
                                </FormRow>
                              )}
                            </form.Field>
                          )),
                          Match.tag('BOOLEAN_CONDITION', () => null),
                          Match.tag('ENUM_CONDITION', () => null),
                          Match.exhaustive,
                        )
                      : null}
                    {value.field
                      ? Match.value(value).pipe(
                          Match.tag('TEXT_CONDITION', () => (
                            <form.Field name={`conditions[${i}].value`}>
                              {(valueField) => (
                                <FormTextField
                                  label={intl.formatMessage({
                                    id: 'create-filter.value',
                                  })}
                                  defaultValue={valueField.state.value.toString()}
                                  onChangeText={(newText) =>
                                    valueField.handleChange(newText)
                                  }
                                  placeholder={intl.formatMessage({
                                    id: 'create-filter.value.placeholder',
                                  })}
                                  autoCorrect={false}
                                />
                              )}
                            </form.Field>
                          )),
                          Match.tag('NUMBER_CONDITION', (numberCondition) => (
                            <form.Field name={`conditions[${i}].value`}>
                              {(valueField) => (
                                <>
                                  {numberCondition.field === 'asa-score' && (
                                    <FormRow
                                      stacked
                                      label={intl.formatMessage({
                                        id: 'create-filter.value',
                                      })}
                                    >
                                      <FormChipSelect
                                        options={[1, 2, 3, 4, 5, 6].map(
                                          (score) => ({
                                            label: `${score}`,
                                            value: score,
                                          }),
                                        )}
                                        value={
                                          typeof valueField.state.value ===
                                          'number'
                                            ? valueField.state.value
                                            : undefined
                                        }
                                        onChange={(score) =>
                                          valueField.handleChange(score)
                                        }
                                      />
                                    </FormRow>
                                  )}
                                </>
                              )}
                            </form.Field>
                          )),
                          Match.tag('BOOLEAN_CONDITION', () => (
                            <form.Field name={`conditions[${i}].value`}>
                              {(valueField) => (
                                <FormRow
                                  label={intl.formatMessage({
                                    id: 'create-filter.value',
                                  })}
                                >
                                  <FormSegmented
                                    options={yesNoOptions}
                                    value={valueField.state.value === true}
                                    onChange={(newValue) =>
                                      valueField.handleChange(newValue)
                                    }
                                  />
                                </FormRow>
                              )}
                            </form.Field>
                          )),
                          Match.tag('ENUM_CONDITION', (enumCondition) => {
                            const sortedOptions = enumCondition.options
                              .map((option) => ({
                                label: intl.formatMessage({
                                  id: `enum.${enumCondition.field}.${option}`,
                                }),
                                value: option,
                                color:
                                  enumCondition.field === 'department'
                                    ? getDepartmentHexColor(option)
                                    : undefined,
                              }))
                              .sort((a, b) => a.label.localeCompare(b.label));
                            return (
                              <form.Field name={`conditions[${i}].value`}>
                                {(valueField) => (
                                  <FormRow
                                    stacked
                                    label={intl.formatMessage({
                                      id: 'create-filter.value',
                                    })}
                                  >
                                    <FormChipSelect
                                      options={sortedOptions}
                                      value={
                                        valueField.state.value || undefined
                                      }
                                      onChange={(newValue) =>
                                        valueField.handleChange(newValue)
                                      }
                                    />
                                  </FormRow>
                                )}
                              </form.Field>
                            );
                          }),
                          Match.exhaustive,
                        )
                      : null}
                  </FormSection>
                );
              })}
              <PressableScale
                onPress={() => {
                  const defaultCondition = BooleanCondition.make({
                    field: 'age',
                    value: false,
                  }) as typeof FilterCondition.Type;
                  field.pushValue(defaultCondition);
                }}
                accessibilityRole="button"
              >
                <View className="mb-6 flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 py-4 dark:border-white/20">
                  <Plus size={18} color={ACCENT} strokeWidth={2.5} />
                  <Text className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">
                    {intl.formatMessage({ id: 'create-filter.add-condition' })}
                  </Text>
                </View>
              </PressableScale>
            </>
          )}
        </form.Field>
        {isEditing && (
          <FormSection>
            <FormButtonRow
              label={intl.formatMessage({ id: 'edit-filter.delete' })}
              destructive
              onPress={handleDelete}
            />
          </FormSection>
        )}
      </FormScrollView>
    </>
  );
}
