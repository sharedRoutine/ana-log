import { Stack, useLocalSearchParams, router } from 'expo-router';
import { TouchableOpacity, Text as RNText } from 'react-native';
import { useIntl } from 'react-intl';
import { useState, useEffect } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { useForm, useStore } from '@tanstack/react-form';
import { DateTime, Schema } from 'effect';
import { useColorScheme } from 'nativewind';
import {
  Host,
  Picker,
  DateTimePicker,
  Text,
  Switch,
  Section,
  Form,
  TextField,
} from '@expo/ui/swift-ui';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from '~/lib/options';
import { calculateAge } from '~/utils/age-utils';

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

export default function UpsertItem() {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  const { caseNumber } = useLocalSearchParams<{ caseNumber?: string }>();

  const [existingItem, setExistingItem] = useState<typeof itemTable.$inferSelect | null>(null);

  useEffect(() => {
    if (caseNumber) {
      db.select()
        .from(itemTable)
        .where(eq(itemTable.caseNumber, caseNumber))
        .then((result) => setExistingItem(result[0] || null));
    }
  }, [caseNumber]);

  const isEditing = Boolean(caseNumber && existingItem);

  const calculateBirthDateFromAge = (
    operationDate: DateTime.Utc,
    ageYears: number,
    ageMonths: number
  ): DateTime.Utc => {
    const operationDateJS = DateTime.toDate(operationDate);
    const birthDate = new Date(operationDateJS);
    birthDate.setFullYear(operationDateJS.getFullYear() - ageYears);
    birthDate.setMonth(operationDateJS.getMonth() - ageMonths);
    return DateTime.unsafeMake(birthDate);
  };

  const getDefaultValues = () => {
    if (isEditing && existingItem) {
      const operationDate = DateTime.unsafeMake(existingItem.date);

      return Item.make({
        caseNumber: existingItem.caseNumber,
        patientBirthDate: calculateBirthDateFromAge(
          operationDate,
          existingItem.ageYears,
          existingItem.ageMonths
        ),
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
      onBlur: ({ value }) => validateForm(value),
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

  const SORTED_AIRWAY_OPTIONS = AIRWAY_OPTIONS.map((option) => ({
    label: intl.formatMessage({ id: `enum.airway-management.${option}` }),
  }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((option) => option.label);

  const SORTED_DEPARTMENT_OPTIONS = DEPARTMENT_OPTIONS.map((option) => ({
    label: intl.formatMessage({ id: `enum.department.${option}` }),
  }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((option) => option.label);

  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: isEditing ? 'edit-item.title' : 'add-item.title' }),
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <RNText className="font-medium text-blue-500">
                {intl.formatMessage({ id: isEditing ? 'edit-item.back' : 'add-item.back' })}
              </RNText>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              disabled={!canSubmit || isSubmitting}
              style={{ opacity: canSubmit && !isSubmitting ? 1 : 0.5 }}
              onPress={() => form.handleSubmit()}>
              <RNText className="font-medium text-blue-500">
                {intl.formatMessage({
                  id: isEditing ? 'edit-item.save-item' : 'add-item.save-item',
                })}
              </RNText>
            </TouchableOpacity>
          ),
        }}
      />
      <Host style={{ flex: 1 }}>
        <Form>
          <>
            <Section title={intl.formatMessage({ id: 'add-item.basic-info' })}>
              <form.Field name="caseNumber">
                {({ state, handleChange }) =>
                  isEditing ? (
                    <Text key={state.value}>{state.value}</Text>
                  ) : (
                    <TextField
                      autocorrection={false}
                      onChangeText={handleChange}
                      defaultValue={state.value}
                      key={state.value}
                      placeholder={intl.formatMessage({ id: 'add-item.case-number' })}
                      keyboardType={'numeric'}
                    />
                  )
                }
              </form.Field>
            </Section>
            <Section title={'Daten'}>
              <form.Field name="operationDate">
                {({ state, handleChange }) => (
                  <DateTimePicker
                    onDateSelected={(date) => {
                      handleChange(DateTime.unsafeMake(date));
                    }}
                    key={state.value.epochMillis}
                    color={colorScheme === 'dark' ? 'white' : 'black'}
                    title={intl.formatMessage({ id: 'add-item.operation-date' })}
                    displayedComponents="date"
                    initialDate={DateTime.toDate(state.value).toISOString()}
                    variant="compact"
                  />
                )}
              </form.Field>
              <form.Field name="patientBirthDate">
                {({ state, handleChange }) =>
                  isEditing ? (
                    <>
                      {state.value && (
                        <Text>
                          {(() => {
                            const age = calculateAge(state.value);
                            return intl.formatMessage(
                              { id: 'add-item.age' },
                              { years: age.years, months: age.months }
                            );
                          })()}
                        </Text>
                      )}
                    </>
                  ) : (
                    <>
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
                      {state.value && (
                        <Text>
                          {(() => {
                            const age = calculateAge(state.value);
                            return intl.formatMessage(
                              { id: 'add-item.age' },
                              { years: age.years, months: age.months }
                            );
                          })()}
                        </Text>
                      )}
                    </>
                  )
                }
              </form.Field>
            </Section>
            <Section title={intl.formatMessage({ id: 'add-item.details' })}>
              <form.Field name="asaScore">
                {({ state, handleChange }) => (
                  <Picker
                    label={intl.formatMessage({ id: 'add-item.asa-score' })}
                    variant="menu"
                    options={['1', '2', '3', '4', '5', '6']}
                    selectedIndex={state.value ? state.value - 1 : -1}
                    onOptionSelected={({ nativeEvent: { index } }) => {
                      handleChange((index + 1) as 1 | 2 | 3 | 4 | 5 | 6);
                    }}
                  />
                )}
              </form.Field>
              <form.Field name="airwayManagement">
                {({ state, handleChange }) => (
                  <Picker
                    variant="menu"
                    label={intl.formatMessage({ id: 'add-item.airway-management' })}
                    options={SORTED_AIRWAY_OPTIONS}
                    selectedIndex={state.value ? SORTED_AIRWAY_OPTIONS.indexOf(state.value) : 0}
                    onOptionSelected={({ nativeEvent: { index } }) => {
                      handleChange(SORTED_AIRWAY_OPTIONS[index]);
                    }}
                  />
                )}
              </form.Field>
              <form.Field name="department">
                {({ state, handleChange }) => (
                  <Picker
                    variant="menu"
                    label={intl.formatMessage({ id: 'add-item.department' })}
                    options={SORTED_DEPARTMENT_OPTIONS}
                    selectedIndex={
                      state.value ? SORTED_DEPARTMENT_OPTIONS.indexOf(state.value) + 1 : 0
                    }
                    onOptionSelected={({ nativeEvent: { index } }) => {
                      handleChange(SORTED_DEPARTMENT_OPTIONS[index - 1]);
                    }}
                  />
                )}
              </form.Field>
              <form.Field name="departmentOther">
                {({ state, handleChange }) => (
                  <>
                    {departmentValue === 'other' && (
                      <TextField
                        placeholder={intl.formatMessage({
                          id: 'add-item.department.other.placeholder',
                        })}
                        defaultValue={state.value}
                        onChangeText={handleChange}
                        autocorrection={false}
                      />
                    )}
                  </>
                )}
              </form.Field>
            </Section>
            <Section title={'Einstellungen'}>
              <form.Field name="specialFeatures">
                {({ state, handleChange }) => (
                  <Switch
                    label={intl.formatMessage({ id: 'add-item.special-features' })}
                    value={state.value}
                    onValueChange={handleChange}
                  />
                )}
              </form.Field>
              <form.Field name="specialFeaturesText">
                {({ state, handleChange }) => (
                  <>
                    {specialFeaturesValue && (
                      <TextField
                        placeholder={intl.formatMessage({
                          id: 'add-item.special-features.placeholder',
                        })}
                        defaultValue={state.value}
                        onChangeText={handleChange}
                        multiline
                        numberOfLines={3}
                        autocorrection={false}
                        allowNewlines={true}
                      />
                    )}
                  </>
                )}
              </form.Field>
              <form.Field name="regionalAnesthesia">
                {({ state, handleChange }) => (
                  <Switch
                    label={intl.formatMessage({ id: 'add-item.regional-anesthesia' })}
                    value={state.value}
                    onValueChange={handleChange}
                  />
                )}
              </form.Field>
              <form.Field name="regionalAnesthesiaText">
                {({ state, handleChange }) => (
                  <>
                    {regionalAnesthesiaValue && (
                      <TextField
                        placeholder={intl.formatMessage({
                          id: 'add-item.regional-anesthesia.placeholder',
                        })}
                        defaultValue={state.value}
                        onChangeText={handleChange}
                        multiline
                        numberOfLines={3}
                        autocorrection={false}
                        allowNewlines={true}
                      />
                    )}
                  </>
                )}
              </form.Field>
              <form.Field name="outpatient">
                {({ state, handleChange }) => (
                  <Switch
                    label={intl.formatMessage({ id: 'add-item.outpatient' })}
                    value={state.value}
                    onValueChange={handleChange}
                  />
                )}
              </form.Field>
            </Section>
            <Section title={'Eingriff'}>
              <form.Field name="procedure">
                {({ state, handleChange }) => (
                  <TextField
                    placeholder={intl.formatMessage({ id: 'add-item.procedure.placeholder' })}
                    defaultValue={state.value}
                    onChangeText={handleChange}
                    multiline
                    numberOfLines={4}
                    autocorrection={false}
                  />
                )}
              </form.Field>
            </Section>
          </>
        </Form>
      </Host>
    </>
  );
}
