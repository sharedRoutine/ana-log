import {
  Button,
  Form,
  Host,
  Picker,
  Section,
  Switch,
  Text,
  Spacer,
  HStack,
  TextFieldRef,
  Stepper,
} from '@expo/ui/swift-ui';
import { useIntl } from 'react-intl';
import { useForm, useStore } from '@tanstack/react-form';
import { Match } from 'effect';
import { FIELDS, Filter, BooleanCondition, FilterCondition } from '~/lib/condition';
import { Fragment } from 'react/jsx-runtime';
import { scrollContentBackground, tint } from '@expo/ui/swift-ui/modifiers';
import { useRef } from 'react';
import { View } from 'react-native';
import { DismissableTextField } from './DismissableTextField';

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
        if (typeof textCondition.value !== 'string' || !textCondition.value.trim()) {
          return 'Empty value in condition';
        }
      }),
      Match.tag('NUMBER_CONDITION', (numberCondition) => {
        if (!numberCondition.field) {
          return 'Missing field';
        }
        if (typeof numberCondition.value !== 'number' || isNaN(numberCondition.value)) {
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
      Match.exhaustive
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
  onSubmit?: (value: typeof Filter.Type & { hasGoal: boolean }) => Promise<void>;
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

  const nameRef = useRef<TextFieldRef>(null);
  const goalRef = useRef<TextFieldRef>(null);
  const textConditionRef = useRef<TextFieldRef>(null);

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
      await nameRef.current?.blur();
      await goalRef.current?.blur();
      await textConditionRef.current?.blur();

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

  const dismiss = async () => {
    await nameRef.current?.blur();
    await goalRef.current?.blur();
    await textConditionRef.current?.blur();
  };
  const save = () => form.handleSubmit();

  return (
    <>
      {children
        ? children({
            canSubmit: canSubmit && !isSubmitting,
            dismiss,
            save,
          })
        : null}
      <View className="flex-1 bg-white dark:bg-black">
        <Host style={{ flex: 1 }}>
          <Form modifiers={[scrollContentBackground('hidden'), tint('#3B82F6')]}>
            <>
              <Section title={intl.formatMessage({ id: 'create-filter.filter-details' })}>
                <form.Field name="name">
                  {({ state, handleChange }) => (
                    <DismissableTextField
                      placeholder={intl.formatMessage({
                        id: 'create-filter.filter-name.placeholder',
                      })}
                      defaultValue={state.value}
                      onChangeText={(text) => handleChange(text)}
                      autocorrection={false}
                      ref={nameRef}
                    />
                  )}
                </form.Field>
                <form.Field name="hasGoal">
                  {({ state, handleChange }) => (
                    <Switch
                      label={intl.formatMessage({ id: 'create-filter.goal' })}
                      value={state.value}
                      onValueChange={(checked) => {
                        handleChange(checked);

                        if (!checked) {
                          form.setFieldValue('goal', undefined);
                        }
                      }}
                      variant="switch"
                    />
                  )}
                </form.Field>
                {hasGoalValue && (
                  <form.Field name="goal">
                    {({ state, handleChange }) => (
                      <Stepper
                        label={intl.formatMessage(
                          { id: 'create-filter.goal-value' },
                          { value: state.value ?? 0 }
                        )}
                        defaultValue={state.value ?? 0}
                        step={1}
                        min={0}
                        onValueChanged={(value) => handleChange(value)}
                      />
                    )}
                  </form.Field>
                )}
              </Section>
              <form.Field name="conditions" mode="array">
                {(field) => (
                  <>
                    {field.state.value.map((_, i) => {
                      const value = field.form.getFieldValue(`conditions[${i}]`);

                      return (
                        <Section
                          key={`condition-${i}`}
                          title={intl.formatMessage(
                            { id: 'create-filter.condition' },
                            { index: i + 1 }
                          )}>
                          <Fragment key={i}>
                            <form.Field key={`field-${i}`} name={`conditions[${i}]`}>
                              {(conditionField) => (
                                <>
                                  {/* Field Selection Renderer */}
                                  <form.Field name={`conditions[${i}].field`}>
                                    {(subField) => {
                                      const currentFieldIndex = FieldsWithName.findIndex(
                                        (f) => f.value === subField.state.value
                                      );
                                      return (
                                        <Picker
                                          label={intl.formatMessage({ id: 'create-filter.field' })}
                                          selectedIndex={
                                            currentFieldIndex >= 0 ? currentFieldIndex : 0
                                          }
                                          options={FieldsWithName.map((o) => o.label)}
                                          variant="menu"
                                          onOptionSelected={({ nativeEvent: { index } }) => {
                                            const field = FieldsWithName[index].value;
                                            const condition = FIELDS.find((f) => f.field === field);
                                            if (condition) {
                                              conditionField.handleChange(condition);
                                            }
                                            subField.handleChange(field);
                                          }}
                                        />
                                      );
                                    }}
                                  </form.Field>

                                  {/* Operator Renderer */}
                                  {value.field &&
                                    Match.value(value).pipe(
                                      Match.tag('TEXT_CONDITION', (textField) => (
                                        <form.Field name={`conditions[${i}].operator`}>
                                          {(operatorField) => {
                                            const ops = Array.from(textField.operators);
                                            const currentOpIndex = ops.findIndex(
                                              (op) => op === operatorField.state.value
                                            );
                                            return (
                                              <Picker
                                                label={intl.formatMessage({
                                                  id: 'create-filter.operator',
                                                })}
                                                options={ops.map((op) =>
                                                  intl.formatMessage({
                                                    id: `create-filter.operator.${op}`,
                                                  })
                                                )}
                                                selectedIndex={
                                                  currentOpIndex >= 0 ? currentOpIndex : 0
                                                }
                                                onOptionSelected={({ nativeEvent: { index } }) => {
                                                  const selectedOp = ops[index];
                                                  operatorField.handleChange(selectedOp);
                                                }}
                                              />
                                            );
                                          }}
                                        </form.Field>
                                      )),
                                      Match.tag('NUMBER_CONDITION', (numberField) => (
                                        <form.Field name={`conditions[${i}].operator`}>
                                          {(operatorField) => {
                                            const ops = Array.from(numberField.operators);
                                            const currentOpIndex = ops.findIndex(
                                              (op) => op === operatorField.state.value
                                            );
                                            return (
                                              <Picker
                                                label={intl.formatMessage({
                                                  id: 'create-filter.operator',
                                                })}
                                                options={ops.map((op) =>
                                                  intl.formatMessage({
                                                    id: `create-filter.operator.${op}`,
                                                  })
                                                )}
                                                selectedIndex={
                                                  currentOpIndex >= 0 ? currentOpIndex : 0
                                                }
                                                onOptionSelected={({ nativeEvent: { index } }) => {
                                                  const selectedOp = ops[index];
                                                  operatorField.handleChange(selectedOp);
                                                }}
                                              />
                                            );
                                          }}
                                        </form.Field>
                                      )),
                                      Match.tag('BOOLEAN_CONDITION', () => null),
                                      Match.tag('ENUM_CONDITION', () => null),
                                      Match.exhaustive
                                    )}

                                  {/* Value Renderer */}
                                  {value.field &&
                                    Match.value(value).pipe(
                                      Match.tag('TEXT_CONDITION', () => (
                                        <form.Field name={`conditions[${i}].value`}>
                                          {(valueField) => (
                                            <>
                                              <Text>
                                                {intl.formatMessage({ id: 'create-filter.value' })}
                                              </Text>
                                              <DismissableTextField
                                                onChangeText={(newText) =>
                                                  valueField.handleChange(newText)
                                                }
                                                defaultValue={valueField.state.value.toString()}
                                                placeholder={intl.formatMessage({
                                                  id: 'create-filter.value.placeholder',
                                                })}
                                                keyboardType="numeric"
                                                ref={textConditionRef}
                                              />
                                            </>
                                          )}
                                        </form.Field>
                                      )),
                                      Match.tag('NUMBER_CONDITION', (numberField) => (
                                        <form.Field name={`conditions[${i}].value`}>
                                          {(valueField) => (
                                            <>
                                              {numberField.field === 'asa-score' && (
                                                <Picker
                                                  label={intl.formatMessage({
                                                    id: 'create-filter.value',
                                                  })}
                                                  variant="menu"
                                                  options={['1', '2', '3', '4', '5', '6']}
                                                  selectedIndex={
                                                    typeof valueField.state.value === 'number'
                                                      ? valueField.state.value - 1
                                                      : 0
                                                  }
                                                  onOptionSelected={({
                                                    nativeEvent: { index },
                                                  }) => {
                                                    valueField.handleChange(index + 1);
                                                  }}
                                                />
                                              )}
                                            </>
                                          )}
                                        </form.Field>
                                      )),
                                      Match.tag('BOOLEAN_CONDITION', () => (
                                        <form.Field name={`conditions[${i}].value`}>
                                          {(valueField) => (
                                            <Picker
                                              label={intl.formatMessage({
                                                id: 'create-filter.value',
                                              })}
                                              options={[
                                                intl.formatMessage({ id: 'create-filter.yes' }),
                                                intl.formatMessage({ id: 'create-filter.no' }),
                                              ]}
                                              variant="segmented"
                                              selectedIndex={
                                                valueField.state.value === true ? 0 : 1
                                              }
                                              onOptionSelected={({ nativeEvent: { index } }) => {
                                                valueField.handleChange(index === 0);
                                              }}
                                            />
                                          )}
                                        </form.Field>
                                      )),
                                      Match.tag('ENUM_CONDITION', (enumField) => {
                                        const sortedOptions = enumField.options
                                          .map((option) => ({
                                            label: intl.formatMessage({
                                              id: `enum.${enumField.field}.${option}`,
                                            }),
                                            value: option,
                                          }))
                                          .sort((a, b) => a.label.localeCompare(b.label));
                                        return (
                                          <form.Field name={`conditions[${i}].value`}>
                                            {(valueField) => {
                                              const currentValueIndex = sortedOptions.findIndex(
                                                (o) => o.value === valueField.state.value
                                              );
                                              return (
                                                <Picker
                                                  label={intl.formatMessage({
                                                    id: 'create-filter.value',
                                                  })}
                                                  selectedIndex={
                                                    currentValueIndex >= 0 ? currentValueIndex : 0
                                                  }
                                                  variant="menu"
                                                  onOptionSelected={(newValue) => {
                                                    const selectedOption =
                                                      sortedOptions[newValue.nativeEvent.index];
                                                    valueField.handleChange(selectedOption.value);
                                                  }}
                                                  options={sortedOptions.map((o) => o.label)}
                                                />
                                              );
                                            }}
                                          </form.Field>
                                        );
                                      }),
                                      Match.exhaustive
                                    )}
                                </>
                              )}
                            </form.Field>
                            {conditions.length > 1 && (
                              <HStack alignment="center">
                                <Spacer />
                                <Button
                                  onPress={() => field.removeValue(i)}
                                  role="destructive"
                                  variant="bordered">
                                  <Text>{intl.formatMessage({ id: 'create-filter.remove' })}</Text>
                                </Button>
                                <Spacer />
                              </HStack>
                            )}
                          </Fragment>
                        </Section>
                      );
                    })}
                    <Section title="">
                      <Button
                        onPress={() => {
                          // Create a default condition and cast to the union type
                          const defaultCondition = BooleanCondition.make({
                            field: 'age',
                            value: false,
                          }) as typeof FilterCondition.Type;
                          field.pushValue(defaultCondition);
                        }}>
                        <Text>{intl.formatMessage({ id: 'create-filter.add-condition' })}</Text>
                      </Button>
                    </Section>
                  </>
                )}
              </form.Field>
            </>
            {isEditing && (
              <Section>
                <Button role="destructive" onPress={onDelete}>
                  <Text>{intl.formatMessage({ id: 'edit-filter.delete' })}</Text>
                </Button>
              </Section>
            )}
          </Form>
        </Host>
      </View>
    </>
  );
}
