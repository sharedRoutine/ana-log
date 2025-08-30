import { Stack, router } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Picker as SwiftUIPicker, Switch } from '@expo/ui/swift-ui';
import { useIntl } from 'react-intl';
import { useForm, useStore } from '@tanstack/react-form';
import { Match } from 'effect';
import { FIELDS, Filter, TextCondition } from '~/lib/condition';
import { db } from '~/db/db';
import { filterConditionTable, filterTable } from '~/db/schema';

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

  const form = useForm({
    defaultValues: {
      ...Filter.make({
        name: '',
        conditions: [
          TextCondition.make({ field: '', operators: new Set(['eq', 'ct']), value: '' }),
        ],
      }),
      hasGoal: false,
    },
    validators: {
      onMount: ({ value }) => validateForm(value),
      onChange: ({ value }) => validateForm(value),
    },
    onSubmit: async ({ value }) => {
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
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="font-medium text-blue-500">
                {intl.formatMessage({ id: 'create-filter.cancel' })}
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => form.handleSubmit()}
              disabled={!canSubmit || isSubmitting}
              style={{ opacity: canSubmit && !isSubmitting ? 1 : 0.5 }}>
              <Text className="font-medium text-blue-500">
                {intl.formatMessage({ id: 'create-filter.save' })}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="p-4">
          <form.Field name="name">
            {({ state, handleChange, handleBlur }) => (
              <View className="mb-6">
                <Text className="mb-2 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'create-filter.filter-name' })}
                </Text>
                <TextInput
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder={intl.formatMessage({ id: 'create-filter.filter-name.placeholder' })}
                  value={state.value}
                  onChangeText={handleChange}
                  onBlur={handleBlur}
                />
              </View>
            )}
          </form.Field>

          <form.Field name="hasGoal">
            {({ state, handleChange }) => (
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="mb-4 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'create-filter.goal' })}
                </Text>
                <Switch
                  value={state.value}
                  onValueChange={(checked) => {
                    handleChange(checked);

                    if (!checked) {
                      form.setFieldValue('goal', undefined);
                    }
                  }}
                  variant="switch"
                />
              </View>
            )}
          </form.Field>

          {hasGoal && (
            <form.Field name="goal">
              {({ state, handleChange }) => (
                <View className="mb-6 rounded-lg border border-gray-300 dark:border-gray-600">
                  <TextInput
                    style={{
                      padding: 10,
                    }}
                    onChangeText={(newText) => {
                      const numericValue = parseInt(newText);
                      handleChange(isNaN(numericValue) ? 0 : numericValue);
                    }}
                    value={state.value ? state.value.toString() : ''}
                    placeholder={intl.formatMessage({
                      id: 'create-filter.value.placeholder',
                    })}
                    keyboardType="numeric"
                  />
                </View>
              )}
            </form.Field>
          )}

          <View className="mb-6">
            <Text className="mb-4 text-lg font-medium dark:text-white">
              {intl.formatMessage({ id: 'create-filter.conditions' })}
            </Text>

            <form.Field name="conditions" mode="array">
              {(field) => (
                <View key={field.name}>
                  {field.state.value.map((_, i) => {
                    const value = field.form.getFieldValue(`conditions[${i}]`);

                    return (
                      <View key={i}>
                        <View className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
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
                          <form.Field key={i} name={`conditions[${i}]`}>
                            {(conditionField) => (
                              <>
                                {/* Field Selection Renderer */}
                                <form.Field name={`conditions[${i}].field`}>
                                  {(subField) => (
                                    <View className="mb-4">
                                      <Text className="mb-2 text-sm font-medium dark:text-white">
                                        {intl.formatMessage({ id: 'create-filter.field' })}
                                      </Text>
                                      <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                        <Picker
                                          selectedValue={subField.state.value}
                                          onValueChange={(newValue) => {
                                            const condition = FIELDS.find(
                                              (f) => f.field === newValue
                                            );
                                            if (condition) {
                                              conditionField.handleChange(condition);
                                            }
                                            subField.handleChange(newValue);
                                          }}>
                                          <Picker.Item
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
                                          ))}
                                        </Picker>
                                      </View>
                                    </View>
                                  )}
                                </form.Field>

                                {/* Operator Renderer */}
                                {value.field &&
                                  Match.value(value).pipe(
                                    Match.tag('TEXT_CONDITION', (textField) => (
                                      <form.Field name={`conditions[${i}].operator`}>
                                        {(operatorField) => (
                                          <View className="mb-4">
                                            <Text className="mb-2 text-sm font-medium dark:text-white">
                                              {intl.formatMessage({ id: 'create-filter.operator' })}
                                            </Text>
                                            <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                              <SwiftUIPicker
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
                                            </View>
                                          </View>
                                        )}
                                      </form.Field>
                                    )),
                                    Match.tag('NUMBER_CONDITION', (numberField) => (
                                      <form.Field name={`conditions[${i}].operator`}>
                                        {(operatorField) => (
                                          <View className="mb-4">
                                            <Text className="mb-2 text-sm font-medium dark:text-white">
                                              {intl.formatMessage({ id: 'create-filter.operator' })}
                                            </Text>
                                            <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                              <SwiftUIPicker
                                                options={Array.from(numberField.operators).map(
                                                  (op) =>
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
                                            </View>
                                          </View>
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
                                          <View className="mb-4">
                                            <Text className="mb-2 text-sm font-medium dark:text-white">
                                              {intl.formatMessage({ id: 'create-filter.value' })}
                                            </Text>
                                            <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                              <TextInput
                                                style={{
                                                  padding: 10,
                                                }}
                                                onChangeText={(newText) =>
                                                  valueField.handleChange(newText)
                                                }
                                                value={valueField.state.value.toString()}
                                                placeholder={intl.formatMessage({
                                                  id: 'create-filter.value.placeholder',
                                                })}
                                                keyboardType="numeric"
                                              />
                                            </View>
                                          </View>
                                        )}
                                      </form.Field>
                                    )),
                                    Match.tag('NUMBER_CONDITION', (numberField) => (
                                      <form.Field name={`conditions[${i}].value`}>
                                        {(valueField) => (
                                          <View className="mb-4">
                                            <Text className="mb-2 text-sm font-medium dark:text-white">
                                              {intl.formatMessage({ id: 'create-filter.value' })}
                                            </Text>
                                            <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                              {numberField.field === 'asa-score' && (
                                                <SwiftUIPicker
                                                  options={['1', '2', '3', '4', '5', '6']}
                                                  selectedIndex={0}
                                                  onOptionSelected={({
                                                    nativeEvent: { index },
                                                  }) => {
                                                    valueField.handleChange(index + 1);
                                                  }}
                                                />
                                              )}
                                            </View>
                                          </View>
                                        )}
                                      </form.Field>
                                    )),
                                    Match.tag('BOOLEAN_CONDITION', () => (
                                      <form.Field name={`conditions[${i}].value`}>
                                        {(valueField) => (
                                          <View className="mb-4">
                                            <Text className="mb-2 text-sm font-medium dark:text-white">
                                              {intl.formatMessage({ id: 'create-filter.value' })}
                                            </Text>
                                            <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                              <SwiftUIPicker
                                                options={[
                                                  intl.formatMessage({ id: 'create-filter.yes' }),
                                                  intl.formatMessage({ id: 'create-filter.no' }),
                                                ]}
                                                selectedIndex={1}
                                                onOptionSelected={({ nativeEvent: { index } }) => {
                                                  valueField.handleChange(index === 0);
                                                }}
                                              />
                                            </View>
                                          </View>
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
                                            <View className="mb-4">
                                              <Text className="mb-2 text-sm font-medium dark:text-white">
                                                {intl.formatMessage({ id: 'create-filter.value' })}
                                              </Text>
                                              <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                                <Picker
                                                  selectedValue={valueField.state.value}
                                                  onValueChange={(newValue) => {
                                                    valueField.handleChange(newValue);
                                                  }}>
                                                  <Picker.Item
                                                    label={intl.formatMessage({
                                                      id: 'create-filter.select-field',
                                                    })}
                                                    value=""
                                                  />
                                                  {sortedOptions.map((option) => (
                                                    <Picker.Item
                                                      key={option.value}
                                                      label={option.label}
                                                      value={option.value}
                                                    />
                                                  ))}
                                                </Picker>
                                              </View>
                                            </View>
                                          )}
                                        </form.Field>
                                      );
                                    }),
                                    Match.exhaustive
                                  )}
                              </>
                            )}
                          </form.Field>
                        </View>
                      </View>
                    );
                  })}
                  <TouchableOpacity
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
                  </TouchableOpacity>
                </View>
              )}
            </form.Field>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
