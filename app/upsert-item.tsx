import { Stack, useLocalSearchParams, router } from 'expo-router';
import { TouchableOpacity, Text as RNText, View } from 'react-native';
import { useIntl } from 'react-intl';
import { useState, useEffect, useRef } from 'react';
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
  TextFieldRef,
  Stepper,
} from '@expo/ui/swift-ui';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from '~/lib/options';
import { listRowBackground, scrollContentBackground, tint } from '@expo/ui/swift-ui/modifiers';

const Item = Schema.Struct({
  caseNumber: Schema.String,
  patientAgeYears: Schema.NonNegative,
  patientAgeMonths: Schema.NonNegative,
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

  const getDefaultValues = () => {
    if (isEditing && existingItem) {
      const operationDate = DateTime.unsafeMake(existingItem.date);

      return Item.make({
        caseNumber: existingItem.caseNumber,
        patientAgeYears: existingItem.ageYears,
        patientAgeMonths: existingItem.ageMonths,
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
      patientAgeYears: 20,
      patientAgeMonths: 0,
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

  const caseNumberRef = useRef<TextFieldRef>(null);
  const departmentOtherRef = useRef<TextFieldRef>(null);
  const specialFeaturesTextRef = useRef<TextFieldRef>(null);
  const regionalAnesthesiaTextRef = useRef<TextFieldRef>(null);
  const procedureRef = useRef<TextFieldRef>(null);

  const form = useForm({
    defaultValues: getDefaultValues(),
    validators: {
      onBlur: ({ value }) => validateForm(value),
      onMount: ({ value }) => validateForm(value),
      onChange: ({ value }) => validateForm(value),
    },
    onSubmit: async ({ value }) => {
      await caseNumberRef.current?.blur();
      await departmentOtherRef.current?.blur();
      await specialFeaturesTextRef.current?.blur();
      await regionalAnesthesiaTextRef.current?.blur();
      await procedureRef.current?.blur();

      const itemValues = {
        caseNumber: value.caseNumber,
        ageYears: value.patientAgeYears,
        ageMonths: value.patientAgeMonths,
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
    value: option,
    label: intl.formatMessage({ id: `enum.airway-management.${option}` }),
  })).sort((a, b) => a.label.localeCompare(b.label));

  const SORTED_DEPARTMENT_OPTIONS = DEPARTMENT_OPTIONS.map((option) => ({
    value: option,
    label: intl.formatMessage({ id: `enum.department.${option}` }),
  })).sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: isEditing ? 'edit-item.title' : 'add-item.title' }),
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity
              onPress={async () => {
                await caseNumberRef.current?.blur();
                await departmentOtherRef.current?.blur();
                await specialFeaturesTextRef.current?.blur();
                await regionalAnesthesiaTextRef.current?.blur();
                await procedureRef.current?.blur();
                router.back();
              }}>
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
      <View className="flex-1 bg-black">
        <Host style={{ flex: 1 }}>
          <Form modifiers={[scrollContentBackground('hidden'), tint('#3B82F6')]}>
            <>
              <Section
                title={intl.formatMessage({ id: 'add-item.basic-info' })}
                modifiers={[listRowBackground('#1C1C1E')]}>
                <form.Field name="caseNumber">
                  {({ state, handleChange }) =>
                    isEditing ? (
                      <Text key={state.value}>{state.value}</Text>
                    ) : (
                      <TextField
                        autocorrection={false}
                        onChangeText={(text) => handleChange(text)}
                        defaultValue={state.value}
                        placeholder={intl.formatMessage({ id: 'add-item.case-number' })}
                        ref={caseNumberRef}
                        keyboardType="numeric"
                      />
                    )
                  }
                </form.Field>
              </Section>
              <Section title={'Daten'} modifiers={[listRowBackground('#1C1C1E')]}>
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
                <form.Field name="patientAgeYears">
                  {({ state, handleChange }) => (
                    <Stepper
                      label={`Alter in Jahren: ${state.value}`}
                      max={120}
                      min={0}
                      step={1}
                      defaultValue={state.value}
                      onValueChanged={(value) => handleChange(value)}
                    />
                  )}
                </form.Field>
                <form.Field name="patientAgeMonths">
                  {({ state, handleChange }) => (
                    <Stepper
                      label={`Alter in Monaten: ${state.value}`}
                      max={11}
                      min={0}
                      step={1}
                      defaultValue={state.value}
                      onValueChanged={(value) => handleChange(value)}
                    />
                  )}
                </form.Field>
              </Section>
              <Section
                title={intl.formatMessage({ id: 'add-item.details' })}
                modifiers={[listRowBackground('#1C1C1E')]}>
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
                      options={SORTED_AIRWAY_OPTIONS.map((option) => option.label)}
                      selectedIndex={
                        state.value
                          ? SORTED_AIRWAY_OPTIONS.map((option) => option.value).indexOf(state.value)
                          : 0
                      }
                      onOptionSelected={({ nativeEvent: { index } }) => {
                        handleChange(SORTED_AIRWAY_OPTIONS[index].value);
                      }}
                    />
                  )}
                </form.Field>
                <form.Field name="department">
                  {({ state, handleChange }) => (
                    <Picker
                      variant="menu"
                      label={intl.formatMessage({ id: 'add-item.department' })}
                      options={SORTED_DEPARTMENT_OPTIONS.map((option) => option.label)}
                      selectedIndex={
                        state.value
                          ? SORTED_DEPARTMENT_OPTIONS.map((option) => option.value).indexOf(
                              state.value
                            )
                          : 0
                      }
                      onOptionSelected={({ nativeEvent: { index } }) => {
                        handleChange(SORTED_DEPARTMENT_OPTIONS[index].value);
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
                          ref={departmentOtherRef}
                        />
                      )}
                    </>
                  )}
                </form.Field>
              </Section>
              <Section title={'Einstellungen'} modifiers={[listRowBackground('#1C1C1E')]}>
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
                          ref={specialFeaturesTextRef}
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
                          ref={regionalAnesthesiaTextRef}
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
              <Section title={'Eingriff'} modifiers={[listRowBackground('#1C1C1E')]}>
                <form.Field name="procedure">
                  {({ state, handleChange }) => (
                    <TextField
                      placeholder={intl.formatMessage({ id: 'add-item.procedure.placeholder' })}
                      defaultValue={state.value}
                      onChangeText={handleChange}
                      multiline
                      numberOfLines={4}
                      autocorrection={false}
                      ref={procedureRef}
                    />
                  )}
                </form.Field>
              </Section>
            </>
          </Form>
        </Host>
      </View>
    </>
  );
}
