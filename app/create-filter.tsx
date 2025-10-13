import { Stack, router } from 'expo-router';
import { Text as RNText, TouchableOpacity } from 'react-native';
import {
  Button,
  Form,
  Host,
  Picker,
  Section,
  Switch,
  TextField,
  Text,
  Spacer,
  HStack,
  TextFieldRef,
} from '@expo/ui/swift-ui';
import { useIntl } from 'react-intl';
import { useForm, useStore } from '@tanstack/react-form';
import { Match } from 'effect';
import { FIELDS, Filter, TextCondition } from '~/lib/condition';
import { db } from '~/db/db';
import { filterConditionTable, filterTable } from '~/db/schema';
import { Fragment } from 'react/jsx-runtime';
import { frame } from '@expo/ui/swift-ui/modifiers';
import { useRef } from 'react';

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

export default function CreateFilter() {
  const intl = useIntl();

  const nameRef = useRef<TextFieldRef>(null);
  const goalRef = useRef<TextFieldRef>(null);
  const textConditionRef = useRef<TextFieldRef>(null);

  const form = useForm({
    defaultValues: {
      ...Filter.make({
        name: '',
        conditions: [
          TextCondition.make({ field: '', operators: new Set(['eq', 'ct'] as const), value: '' }),
        ],
      }),
      hasGoal: false,
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

      await db.transaction(async (tx) => {
        const [f] = await tx
          .insert(filterTable)
          .values({ name: value.name, goal: value.goal })
          .returning({ id: filterTable.id });

        for (const condition of value.conditions) {
          await Match.value(condition).pipe(
            Match.tag('TEXT_CONDITION', (textCondition) =>
              tx
                .insert(filterConditionTable)
                .values({
                  filterId: f.id,
                  type: 'TEXT_CONDITION',
                  field: textCondition.field,
                  operator: textCondition.operator,
                  valueText: textCondition.value,
                })
                .execute()
            ),
            Match.tag('NUMBER_CONDITION', (numberCondition) =>
              tx
                .insert(filterConditionTable)
                .values({
                  filterId: f.id,
                  type: 'NUMBER_CONDITION',
                  field: numberCondition.field,
                  operator: numberCondition.operator,
                  valueNumber: numberCondition.value,
                })
                .execute()
            ),
            Match.tag('BOOLEAN_CONDITION', (booleanCondition) =>
              tx
                .insert(filterConditionTable)
                .values({
                  filterId: f.id,
                  type: 'BOOLEAN_CONDITION',
                  field: booleanCondition.field,
                  valueBoolean: booleanCondition.value,
                })
                .execute()
            ),
            Match.tag('ENUM_CONDITION', (enumCondition) =>
              tx
                .insert(filterConditionTable)
                .values({
                  filterId: f.id,
                  type: 'ENUM_CONDITION',
                  field: enumCondition.field,
                  valueEnum: enumCondition.value,
                })
                .execute()
            ),
            Match.exhaustive
          );
        }
      });
      router.back();
      form.reset();
    },
  });

  const FieldsWithName = FIELDS.map(({ field }) => ({
    label: intl.formatMessage({ id: `create-filter.field.${field}` }),
    value: field,
  })).sort((a, b) => a.label.localeCompare(b.label));

  const hasGoal = useStore(form.store, (state) => state.values.hasGoal);
  const conditions = useStore(form.store, (state) => state.values.conditions);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'create-filter.title' }),
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity
              onPress={async () => {
                await nameRef.current?.blur();
                await goalRef.current?.blur();
                await textConditionRef.current?.blur();

                router.back();
              }}>
              <RNText className="font-medium text-blue-500">
                {intl.formatMessage({ id: 'create-filter.cancel' })}
              </RNText>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              disabled={!canSubmit || isSubmitting}
              style={{ opacity: canSubmit && !isSubmitting ? 1 : 0.5 }}
              onPress={() => form.handleSubmit()}>
              <RNText className="font-medium text-blue-500">
                {intl.formatMessage({ id: 'create-filter.save' })}
              </RNText>
            </TouchableOpacity>
          ),
        }}
      />
      <Host style={{ flex: 1 }}>
        <Form>
          <>
            <Section title="A">
              <form.Field name="name">
                {({ state, handleChange }) => (
                  <TextField
                    placeholder={intl.formatMessage({
                      id: 'create-filter.filter-name.placeholder',
                    })}
                    defaultValue={state.value}
                    onChangeText={handleChange}
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
              {hasGoal && (
                <form.Field name="goal">
                  {({ state, handleChange }) => (
                    <TextField
                      onChangeText={(newText) => {
                        const numericValue = parseInt(newText);
                        handleChange(isNaN(numericValue) ? 0 : numericValue);
                      }}
                      defaultValue={state.value ? state.value.toString() : ''}
                      placeholder={intl.formatMessage({
                        id: 'create-filter.value.placeholder',
                      })}
                      keyboardType="numeric"
                      ref={goalRef}
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
                          {conditions.length > 1 && (
                            <HStack
                              alignment="center"
                              modifiers={[frame({ alignment: 'trailing' })]}>
                              <Spacer />
                              <Button
                                onPress={() => field.removeValue(i)}
                                role="destructive"
                                systemImage="minus.circle"
                                variant="bordered">
                                <Text>{intl.formatMessage({ id: 'create-filter.remove' })}</Text>
                              </Button>
                            </HStack>
                          )}
                          <form.Field key={`field-${i}`} name={`conditions[${i}]`}>
                            {(conditionField) => (
                              <>
                                {/* Field Selection Renderer */}
                                <form.Field name={`conditions[${i}].field`}>
                                  {(subField) => (
                                    <Picker
                                      label={intl.formatMessage({ id: 'create-filter.field' })}
                                      selectedIndex={0}
                                      options={FieldsWithName.map((o) => o.label)}
                                      variant="menu"
                                      onOptionSelected={({ nativeEvent: { index } }) => {
                                        const field = FieldsWithName[index].value;
                                        const condition = FIELDS.find((f) => f.field === field);
                                        if (condition) {
                                          conditionField.handleChange(condition);
                                        }
                                        subField.handleChange(field);
                                      }}>
                                      {/* <Picker.Item
                                          label={intl.formatMessage({
                                            id: 'create-filter.select-field',
                                          })}
                                          value=""
                                        />
                                        {FieldsWithName.map((option) => (
                                          <Picker.Item
                                            key={option.value}
                                            label={option.label}
                                            value={option.value}
                                          />
                                        ))} */}
                                    </Picker>
                                  )}
                                </form.Field>

                                {/* Operator Renderer */}
                                {value.field &&
                                  Match.value(value).pipe(
                                    Match.tag('TEXT_CONDITION', (textField) => (
                                      <form.Field name={`conditions[${i}].operator`}>
                                        {(operatorField) => (
                                          <Picker
                                            label={intl.formatMessage({
                                              id: 'create-filter.operator',
                                            })}
                                            options={Array.from(textField.operators).map((op) =>
                                              intl.formatMessage({
                                                id: `create-filter.operator.${op}`,
                                              })
                                            )}
                                            selectedIndex={0}
                                            onOptionSelected={({ nativeEvent: { index } }) => {
                                              const ops = Array.from(textField.operators);
                                              const selectedOp = ops[index];
                                              operatorField.handleChange(selectedOp);
                                            }}
                                          />
                                        )}
                                      </form.Field>
                                    )),
                                    Match.tag('NUMBER_CONDITION', (numberField) => (
                                      <form.Field name={`conditions[${i}].operator`}>
                                        {(operatorField) => (
                                          <Picker
                                            label={intl.formatMessage({
                                              id: 'create-filter.operator',
                                            })}
                                            options={Array.from(numberField.operators).map((op) =>
                                              intl.formatMessage({
                                                id: `create-filter.operator.${op}`,
                                              })
                                            )}
                                            selectedIndex={0}
                                            onOptionSelected={({ nativeEvent: { index } }) => {
                                              const ops = Array.from(numberField.operators);
                                              const selectedOp = ops[index];
                                              operatorField.handleChange(selectedOp);
                                            }}
                                          />
                                        )}
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
                                            <TextField
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
                                                selectedIndex={0}
                                                onOptionSelected={({ nativeEvent: { index } }) => {
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
                                            selectedIndex={1}
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
                                          {(valueField) => (
                                            <Picker
                                              label={intl.formatMessage({
                                                id: 'create-filter.value',
                                              })}
                                              selectedIndex={0}
                                              variant="menu"
                                              onOptionSelected={(newValue) => {
                                                // valueField.handleChange(newValue);
                                              }}
                                              options={sortedOptions.map((o) => o.label)}
                                            />
                                          )}
                                        </form.Field>
                                      );
                                    }),
                                    Match.exhaustive
                                  )}
                              </>
                            )}
                          </form.Field>
                          {/* <View className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                          <View className="mb-4 flex-row items-center justify-between">
                            <Text className="text-base font-medium dark:text-white">
                              {intl.formatMessage(
                                { id: 'create-filter.condition' },
                                { index: i + 1 }
                              )}
                            </Text>
                            {conditions.length > 1 && (
                              <TouchableOpacity
                                onPress={() => field.removeValue(i)}
                                className="rounded bg-red-100 px-3 py-1 dark:bg-red-900">
                                <Text className="text-sm text-red-800 dark:text-red-200">
                                  {intl.formatMessage({ id: 'create-filter.remove' })}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View> */}
                        </Fragment>
                      </Section>
                    );
                  })}
                  {/* <TouchableOpacity
                    onPress={() =>
                      field.pushValue(
                        // @ts-expect-error Not sure why TS is unhappy here
                        TextCondition.make({
                          field: '',
                          operators: new Set(['eq', 'ct']),
                          value: '',
                        })
                      )
                    }
                    className="items-center rounded-lg bg-blue-500 p-3">
                    <Text className="font-medium text-white">
                      {intl.formatMessage({ id: 'create-filter.add-condition' })}
                    </Text>
                  </TouchableOpacity> */}
                  <Section title="">
                    <Button
                      onPress={() => {
                        field.pushValue(
                          // @ts-expect-error Not sure why TS is unhappy here
                          TextCondition.make({
                            field: '',
                            operators: new Set(['eq', 'ct'] as const),
                            value: '',
                          })
                        );
                      }}>
                      <Text>{intl.formatMessage({ id: 'create-filter.add-condition' })}</Text>
                    </Button>
                  </Section>
                </>
              )}
            </form.Field>
          </>
        </Form>
      </Host>
    </>
  );
}
