import { Stack, router } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useIntl } from 'react-intl';
import { useForm, useStore } from '@tanstack/react-form';
import { Schema } from 'effect';

const TextCondition = Schema.TaggedStruct('TEXT_CONDITION', {
  field: Schema.String,
  operator: Schema.Literal('eq', 'ct'),
  value: Schema.String,
});

const NumberCondition = Schema.TaggedStruct('NUMBER_CONDITION', {
  field: Schema.String,
  operator: Schema.Literal('eq', 'gt', 'gte', 'lt', 'lte'),
  value: Schema.Number,
});

const BooleanCondition = Schema.TaggedStruct('BOOLEAN_CONDITION', {
  field: Schema.String,
  operator: Schema.Literal('eq'),
  value: Schema.Boolean,
});

const FilterCondition = Schema.Union(TextCondition, NumberCondition, BooleanCondition);

const Filter = Schema.Struct({
  name: Schema.String,
  conditions: Schema.NonEmptyArray(FilterCondition),
});

const FIELDS = [
  NumberCondition.make({
    field: 'asa-score',
    operator: 'eq',
    value: 1,
  }),
  TextCondition.make({
    field: 'case-number',
    operator: 'eq',
    value: '',
  }),
  TextCondition.make({
    field: 'department',
    operator: 'eq',
    value: '', // 'TC', 'NC', 'AC', 'GC', 'HNO', 'HG', 'DE', 'PC', 'UC', 'URO', 'GYN', 'MKG', 'RAD', 'NRAD', 'other'
  }),
  TextCondition.make({
    field: 'airway-management',
    operator: 'eq',
    value: '',
  }),
  BooleanCondition.make({
    field: 'outpatient',
    operator: 'eq',
    value: false,
  }),
  BooleanCondition.make({
    field: 'special-features',
    operator: 'eq',
    value: false,
  }),
  BooleanCondition.make({
    field: 'regional-anesthesia',
    operator: 'eq',
    value: false,
  }),
  TextCondition.make({
    field: 'procedure',
    operator: 'eq',
    value: '',
  }),
];

export default function CreateFilter() {
  const intl = useIntl();

  const form = useForm({
    defaultValues: Filter.make({
      name: '',
      conditions: [TextCondition.make({ field: '', operator: 'eq', value: '' })],
    }),
    onSubmit: async ({ value }) => {
      console.log('Form submitted:', value);
      router.back();
    },
  });

  const FieldsWithName = AvailableFields.map((field) => ({
    label: intl.formatMessage({ id: `create-filter.field.${field}` }),
    value: field,
  })).sort((a, b) => a.label.localeCompare(b.label));

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

          <View className="mb-6">
            <Text className="mb-4 text-lg font-medium dark:text-white">
              {intl.formatMessage({ id: 'create-filter.conditions' })}
            </Text>

            <form.Field name="conditions" mode="array">
              {(field) => (
                <View key="conditions">
                  {field.state.value.map((condition, i) => {
                    const value = field.form.getFieldValue(`conditions[${i}]`);
                    return (
                      <>
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
                          <form.Field key={i} name={`conditions[${i}].field`}>
                            {(subField) => (
                              <View className="mb-4">
                                <Text className="mb-2 text-sm font-medium dark:text-white">
                                  {intl.formatMessage({ id: 'create-filter.field' })}
                                </Text>
                                <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                                  <Picker
                                    selectedValue={subField.state.value}
                                    onValueChange={(newValue) => {
                                      const condition = FIELDS.find((f) => f.field === newValue);
                                      if (condition) {
                                        field.form.setFieldValue(`conditions[${i}]`, condition);
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
                          <Text>{value._tag}</Text>
                        </View>
                      </>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() =>
                      field.pushValue(TextCondition.make({ field: '', operator: 'eq', value: '' }))
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
