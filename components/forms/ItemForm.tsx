import { View, Text, TextInput, ScrollView, Switch } from 'react-native';
import { useForm, useStore } from '@tanstack/react-form';
import { DateTimePicker } from '@expo/ui/swift-ui';
import { useIntl } from 'react-intl';
import { DateTime, Schema } from 'effect';
import { cssInterop, useColorScheme } from 'nativewind';
import { Picker } from '@react-native-picker/picker';
import { Picker as SwiftUIPicker } from '@expo/ui/swift-ui';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from '~/lib/options';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { router } from 'expo-router';
import { eq } from 'drizzle-orm';
import { calculateAge } from '~/utils/age-utils';
import { HorizontalLine } from '~/components/ui/HorizontalLine';
import { useEffect } from 'react';

cssInterop(Picker, {
  className: 'style',
});

const Item = Schema.Struct({
  caseNumber: Schema.String,
  patientBirthDate: Schema.DateTimeUtc,
  operationDate: Schema.DateTimeUtc,
  asaScore: Schema.Literal(1, 2, 3, 4, 5, 6),
  airwayManagement: Schema.String,
  department: Schema.String,
  departmentOther: Schema.String,
  specialFeatures: Schema.Boolean,
  specialFeaturesText: Schema.String,
  regionalAnesthesia: Schema.Boolean,
  regionalAnesthesiaText: Schema.String,
  outpatient: Schema.Boolean,
  procedure: Schema.String,
});

const validateForm = (value: typeof Item.Type) => {
  if (!value.caseNumber) {
    return 'No case number';
  }
  if (!value.airwayManagement) {
    return 'No airway management';
  }
  if (!value.department) {
    return 'No department';
  }
};

interface ItemFormProps {
  caseNumber?: string;
  existingItem?: typeof itemTable.$inferSelect | null;
  isEditing: boolean;
  onFormStateChange?: (state: {
    canSubmit: boolean;
    isSubmitting: boolean;
    handleSubmit: () => void;
  }) => void;
}

export function ItemForm({
  caseNumber,
  existingItem,
  isEditing,
  onFormStateChange,
}: ItemFormProps) {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  const calculateBirthDateFromAge = (
    operationDate: DateTime.Utc,
    ageYears: number,
    ageMonths: number
  ): DateTime.Utc => {
    const operationDateJS = DateTime.toDate(operationDate);
    const birthDate = new Date(operationDateJS);
    birthDate.setFullYear(ageYears);
    birthDate.setMonth(ageMonths);
    return DateTime.unsafeMake(birthDate);
  };

  const getDefaultValues = () => {
    if (isEditing && existingItem) {
      const operationDate = DateTime.unsafeMake(new Date(existingItem.date));

      console.log('existingItem', existingItem);

      return Item.make({
        caseNumber: existingItem.caseNumber,
        patientBirthDate: DateTime.unsafeMake({
          year: existingItem.ageYears,
          month: existingItem.ageMonths,
        }),
        operationDate,
        asaScore: existingItem.asaScore as 1 | 2 | 3 | 4 | 5 | 6,
        airwayManagement: existingItem.airwayManagement,
        department: existingItem.department,
        departmentOther: '',
        specialFeatures: Boolean(existingItem.specials),
        specialFeaturesText: existingItem.specials || '',
        regionalAnesthesia: existingItem.localAnesthetics,
        regionalAnesthesiaText: '',
        outpatient: existingItem.outpatient,
        procedure: existingItem.procedure,
      });
    }

    return Item.make({
      caseNumber: '',
      patientBirthDate: DateTime.unsafeMake(new Date()),
      operationDate: DateTime.unsafeMake(new Date()),
      asaScore: 1,
      airwayManagement: '',
      department: '',
      departmentOther: '',
      specialFeatures: false,
      specialFeaturesText: '',
      regionalAnesthesia: false,
      regionalAnesthesiaText: '',
      outpatient: false,
      procedure: '',
    });
  };

  const form = useForm({
    defaultValues: getDefaultValues(),
    validators: {
      onMount: ({ value }) => validateForm(value),
      onChange: ({ value }) => validateForm(value),
    },
    onSubmit: async ({ value }) => {
      const age = calculateAge(value.patientBirthDate);
      const itemValues = {
        caseNumber: value.caseNumber,
        ageYears: age.years,
        ageMonths: age.months,
        date: value.operationDate.epochMillis,
        asaScore: value.asaScore,
        airwayManagement: value.airwayManagement,
        department: value.department,
        specials: value.specialFeatures ? value.specialFeaturesText : null,
        localAnesthetics: value.regionalAnesthesia,
        outpatient: value.outpatient,
        procedure: value.procedure,
      };

      if (isEditing && caseNumber) {
        await db.update(itemTable).set(itemValues).where(eq(itemTable.caseNumber, caseNumber));
      } else {
        await db.insert(itemTable).values(itemValues);
      }

      router.back();
      form.reset();
    },
  });

  const departmentValue = useStore(form.store, (state) => state.values.department);
  const specialFeaturesValue = useStore(form.store, (state) => state.values.specialFeatures);
  const regionalAnesthesiaValue = useStore(form.store, (state) => state.values.regionalAnesthesia);

  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  // Notify parent component of form state changes
  useEffect(() => {
    onFormStateChange?.({ canSubmit, isSubmitting, handleSubmit: () => form.handleSubmit() });
  }, [canSubmit, isSubmitting, onFormStateChange, form]);

  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="p-4">
        <View className="mb-6">
          <Text className="mb-4 text-xl font-bold text-gray-600 dark:text-gray-300">
            {intl.formatMessage({ id: 'add-item.basic-info' })}
          </Text>

          <form.Field name="caseNumber">
            {(field) => (
              <View className="mb-4">
                <Text className="mb-2 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'add-item.case-number' })}
                </Text>
                <TextInput
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder={intl.formatMessage({ id: 'add-item.case-number.placeholder' })}
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
            )}
          </form.Field>

          <HorizontalLine />

          <form.Field name="patientBirthDate">
            {({ state, handleChange }) => (
              <>
                <View className="mb-4 flex flex-row items-center justify-between">
                  <DateTimePicker
                    onDateSelected={(date) => {
                      handleChange(DateTime.unsafeMake(date));
                    }}
                    title={intl.formatMessage({ id: 'add-item.age-of-patient' })}
                    color={colorScheme === 'dark' ? 'white' : 'black'}
                    displayedComponents="date"
                    initialDate={DateTime.toDate(state.value).toISOString()}
                    variant="compact"
                  />
                </View>
                <View className="mb-2 flex flex-col items-start">
                  {state.value && (
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {(() => {
                        const age = calculateAge(state.value);
                        return intl.formatMessage(
                          { id: 'add-item.age' },
                          { years: age.years, months: age.months }
                        );
                      })()}
                    </Text>
                  )}
                </View>
              </>
            )}
          </form.Field>

          <HorizontalLine />

          <form.Field name="operationDate">
            {({ state, handleChange }) => (
              <View className="mb-4 flex flex-row items-center justify-between">
                <DateTimePicker
                  onDateSelected={(date) => {
                    handleChange(DateTime.unsafeMake(date));
                  }}
                  color={colorScheme === 'dark' ? 'white' : 'black'}
                  title={intl.formatMessage({ id: 'add-item.operation-date' })}
                  displayedComponents="date"
                  initialDate={DateTime.toDate(state.value).toISOString()}
                  variant="compact"
                />
              </View>
            )}
          </form.Field>
        </View>

        <View className="mb-6">
          <Text className="mb-4 text-xl font-bold text-gray-600 dark:text-gray-300">
            {intl.formatMessage({ id: 'add-item.details' })}
          </Text>

          <form.Field name="asaScore">
            {({ state, handleChange }) => (
              <View className="mb-4">
                <Text className="mb-2 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'add-item.asa-score' })}
                </Text>
                <SwiftUIPicker
                  options={['1', '2', '3', '4', '5', '6']}
                  selectedIndex={state.value ? state.value - 1 : -1}
                  onOptionSelected={({ nativeEvent: { index } }) => {
                    handleChange((index + 1) as 1 | 2 | 3 | 4 | 5 | 6);
                  }}
                  variant="segmented"
                  style={{
                    height: 40,
                  }}
                />
              </View>
            )}
          </form.Field>

          <form.Field name="airwayManagement">
            {({ state, handleChange }) => (
              <View className="mb-4">
                <Text className="mb-2 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'add-item.airway-management' })}
                </Text>
                <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                  <Picker
                    selectedValue={state.value}
                    onValueChange={handleChange}
                    style={{ height: 200 }}>
                    <Picker.Item
                      label={intl.formatMessage({ id: 'create-filter.select-airway' })}
                      value=""
                    />
                    {AIRWAY_OPTIONS.map((option) => ({
                      label: intl.formatMessage({ id: `enum.airway-management.${option}` }),
                      value: option,
                    }))
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} />
                      ))}
                  </Picker>
                </View>
              </View>
            )}
          </form.Field>

          <form.Field name="department">
            {({ state, handleChange }) => (
              <View className="mb-4">
                <Text className="mb-2 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'add-item.department' })}
                </Text>
                <View className="rounded-lg border border-gray-300 dark:border-gray-600">
                  <Picker
                    selectedValue={state.value}
                    onValueChange={handleChange}
                    style={{ height: 200 }}>
                    <Picker.Item
                      label={intl.formatMessage({ id: 'create-filter.select-department' })}
                      value=""
                    />
                    {DEPARTMENT_OPTIONS.map((option) => (
                      <Picker.Item
                        key={option}
                        label={intl.formatMessage({ id: `enum.department.${option}` })}
                        value={option}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
          </form.Field>

          <form.Field name="departmentOther">
            {({ state, handleChange }) => (
              <>
                {departmentValue === 'other' && (
                  <View className="mb-4">
                    <TextInput
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder={intl.formatMessage({
                        id: 'add-item.department.other.placeholder',
                      })}
                      value={state.value}
                      onChangeText={handleChange}
                      autoCorrect={false}
                      spellCheck={false}
                    />
                  </View>
                )}
              </>
            )}
          </form.Field>

          <form.Field name="specialFeatures">
            {({ state, handleChange }) => (
              <View className="mb-4">
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-lg font-medium dark:text-white">
                    {intl.formatMessage({ id: 'add-item.special-features' })}
                  </Text>
                  <Switch value={state.value} onValueChange={handleChange} />
                </View>
              </View>
            )}
          </form.Field>

          <form.Field name="specialFeaturesText">
            {({ state, handleChange }) => (
              <>
                {specialFeaturesValue && (
                  <View className="mb-4">
                    <TextInput
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder={intl.formatMessage({
                        id: 'add-item.special-features.placeholder',
                      })}
                      value={state.value}
                      onChangeText={handleChange}
                      multiline
                      numberOfLines={3}
                      autoCorrect={false}
                      spellCheck={false}
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </>
            )}
          </form.Field>

          <form.Field name="regionalAnesthesia">
            {({ state, handleChange }) => (
              <View className="mb-4">
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-lg font-medium dark:text-white">
                    {intl.formatMessage({ id: 'add-item.regional-anesthesia' })}
                  </Text>
                  <Switch value={state.value} onValueChange={handleChange} />
                </View>
              </View>
            )}
          </form.Field>

          <form.Field name="regionalAnesthesiaText">
            {({ state, handleChange }) => (
              <>
                {regionalAnesthesiaValue && (
                  <View className="mb-4">
                    <TextInput
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder={intl.formatMessage({
                        id: 'add-item.regional-anesthesia.placeholder',
                      })}
                      value={state.value}
                      onChangeText={handleChange}
                      multiline
                      numberOfLines={3}
                      autoCorrect={false}
                      spellCheck={false}
                      textAlignVertical="top"
                    />
                  </View>
                )}
              </>
            )}
          </form.Field>

          <form.Field name="outpatient">
            {({ state, handleChange }) => (
              <View className="mb-4">
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-lg font-medium dark:text-white">
                    {intl.formatMessage({ id: 'add-item.outpatient' })}
                  </Text>
                  <Switch value={state.value} onValueChange={handleChange} />
                </View>
              </View>
            )}
          </form.Field>

          <form.Field name="procedure">
            {({ state, handleChange }) => (
              <View className="mb-4">
                <Text className="mb-2 text-lg font-medium dark:text-white">
                  {intl.formatMessage({ id: 'add-item.procedure' })}
                </Text>
                <TextInput
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder={intl.formatMessage({ id: 'add-item.procedure.placeholder' })}
                  value={state.value}
                  onChangeText={handleChange}
                  multiline
                  numberOfLines={4}
                  autoCorrect={false}
                  spellCheck={false}
                  textAlignVertical="top"
                />
              </View>
            )}
          </form.Field>
        </View>
      </View>
    </ScrollView>
  );
}
