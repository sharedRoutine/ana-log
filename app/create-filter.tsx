import { Stack, router } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Picker as SwiftUIPicker } from '@expo/ui/swift-ui';
import { useIntl } from 'react-intl';
import { useForm, useStore } from '@tanstack/react-form';
import type { FilterCondition } from '../db/schema';
import {
  getFieldOptions,
  getOperatorOptions,
  getAvailableOperators,
  getInputTypeForField,
  DEPARTMENT_OPTIONS,
  AIRWAY_OPTIONS,
} from '../constants/fieldOptions';

export default function CreateFilter() {
  const intl = useIntl();
  const fieldOptions = getFieldOptions(intl);
  const operatorOptions = getOperatorOptions(intl);

  const form = useForm({
    defaultValues: {
      filterName: '',
      conditions: [{ field: '', operator: '', value: '' }] as FilterCondition[],
    },
  });

  const conditions = useStore(form.store, (state) => state.values.conditions);

  const updateCondition = (index: number, field: keyof FilterCondition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };

    // Reset operator and value when field changes
    if (field === 'field') {
      newConditions[index].operator = '';
      newConditions[index].value = '';
    }
    // Reset value when operator changes
    if (field === 'operator') {
      newConditions[index].value = '';
    }

    form.setFieldValue('conditions', newConditions);
  };

  const addCondition = () => {
    const newConditions = [...conditions, { field: '', operator: '', value: '' }];
    form.setFieldValue('conditions', newConditions);
  };

  const removeCondition = (index: number) => {
    if (conditions.length > 1) {
      const newConditions = conditions.filter((_, i) => i !== index);
      form.setFieldValue('conditions', newConditions);
    }
  };

  const FieldPicker = ({ condition, index }: { condition: FilterCondition; index: number }) => {
    return (
      <View className="mb-4">
        <Text className="mb-2 text-sm font-medium dark:text-white">
          {intl.formatMessage({ id: 'create-filter.field' })}
        </Text>
        <View className="rounded-lg border border-gray-300 dark:border-gray-600">
          <Picker
            selectedValue={condition.field}
            onValueChange={(value) => updateCondition(index, 'field', value)}>
            <Picker.Item
              label={intl.formatMessage({ id: 'create-filter.select-field' })}
              value=""
            />
            {fieldOptions.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  const renderOperatorPicker = (condition: FilterCondition, index: number) => {
    if (!condition.field) return null;

    const availableOperators = getAvailableOperators(condition.field);
    const filteredOperatorOptions = operatorOptions.filter((option) =>
      availableOperators.includes(option.value)
    );
    const selectedOperatorIndex = filteredOperatorOptions.findIndex(
      (option) => option.value === condition.operator
    );

    return (
      <View className="mb-4">
        <Text className="mb-2 text-sm font-medium dark:text-white">
          {intl.formatMessage({ id: 'create-filter.operator' })}
        </Text>
        <SwiftUIPicker
          options={filteredOperatorOptions.map((option) => option.label)}
          selectedIndex={selectedOperatorIndex >= 0 ? selectedOperatorIndex : -1}
          onOptionSelected={({ nativeEvent: { index } }) => {
            updateCondition(index, 'operator', filteredOperatorOptions[index].value);
          }}
          variant="segmented"
          style={{ height: 40 }}
        />
      </View>
    );
  };

  const renderValueInput = (condition: FilterCondition, index: number) => {
    if (!condition.field || !condition.operator) return null;

    const inputType = getInputTypeForField(condition.field, condition.operator);

    if (inputType === 'none') {
      return null;
    }

    if (inputType === 'select-department') {
      return (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium dark:text-white">
            {intl.formatMessage({ id: 'create-filter.value' })}
          </Text>
          <View className="rounded-lg border border-gray-300 dark:border-gray-600">
            <Picker
              selectedValue={condition.value}
              onValueChange={(value) => updateCondition(index, 'value', value)}
              style={{ height: 120 }}>
              <Picker.Item
                label={intl.formatMessage({ id: 'create-filter.select-department' })}
                value=""
              />
              {DEPARTMENT_OPTIONS.map((dept) => (
                <Picker.Item key={dept} label={dept} value={dept} />
              ))}
            </Picker>
          </View>
        </View>
      );
    }

    if (inputType === 'select-airway') {
      return (
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium dark:text-white">
            {intl.formatMessage({ id: 'create-filter.value' })}
          </Text>
          <View className="rounded-lg border border-gray-300 dark:border-gray-600">
            <Picker
              selectedValue={condition.value}
              onValueChange={(value) => updateCondition(index, 'value', value)}
              style={{ height: 120 }}>
              <Picker.Item
                label={intl.formatMessage({ id: 'create-filter.select-airway' })}
                value=""
              />
              {AIRWAY_OPTIONS.map((airway) => (
                <Picker.Item key={airway} label={airway} value={airway} />
              ))}
            </Picker>
          </View>
        </View>
      );
    }

    return (
      <View className="mb-4">
        <Text className="mb-2 text-sm font-medium dark:text-white">
          {intl.formatMessage({ id: 'create-filter.value' })}
        </Text>
        <TextInput
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          placeholder={intl.formatMessage({ id: 'create-filter.enter-value' })}
          value={String(condition.value)}
          onChangeText={(text) => {
            const value = inputType === 'number' ? (text ? Number(text) : '') : text;
            updateCondition(index, 'value', value);
          }}
          keyboardType={inputType === 'number' ? 'numeric' : 'default'}
        />
      </View>
    );
  };

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
        }}
      />
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="p-4">
          <form.Field name="filterName">
            {(field) => (
              <View className="mb-6">
                <Text className="mb-2 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'create-filter.filter-name' })}
                </Text>
                <TextInput
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder={intl.formatMessage({ id: 'create-filter.filter-name.placeholder' })}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                />
              </View>
            )}
          </form.Field>

          <View className="mb-6">
            <Text className="mb-4 text-lg font-medium dark:text-white">
              {intl.formatMessage({ id: 'create-filter.conditions' })}
            </Text>

            {conditions.map((condition, index) => (
              <View
                key={index}
                className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-600 dark:bg-gray-800">
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="text-base font-medium dark:text-white">
                    {intl.formatMessage({ id: 'create-filter.condition' })} {index + 1}
                  </Text>
                  {conditions.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeCondition(index)}
                      className="rounded bg-red-100 px-3 py-1 dark:bg-red-900">
                      <Text className="text-sm text-red-800 dark:text-red-200">
                        {intl.formatMessage({ id: 'create-filter.remove' })}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <FieldPicker condition={condition} index={index} />
                {renderOperatorPicker(condition, index)}
                {renderValueInput(condition, index)}
              </View>
            ))}

            <TouchableOpacity
              onPress={addCondition}
              className="items-center rounded-lg bg-blue-500 p-3">
              <Text className="font-medium text-white">
                {intl.formatMessage({ id: 'create-filter.add-condition' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
