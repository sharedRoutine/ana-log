import { router } from 'expo-router';
import { View } from 'react-native';
import { useIntl } from 'react-intl';
import { useCallback, useRef } from 'react';
import { itemTable } from '~/db/schema';
import { useForm, useStore } from '@tanstack/react-form';
import { DateTime } from 'effect';
import { useColorScheme } from 'nativewind';
import {
  Host,
  Picker,
  DateTimePicker,
  Switch,
  Section,
  Form,
  TextField,
  TextFieldRef,
  Stepper,
} from '@expo/ui/swift-ui';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from '~/lib/options';
import { listRowBackground, scrollContentBackground, tint } from '@expo/ui/swift-ui/modifiers';
import { Item } from '~/lib/schema';

const validateFormInternally = (value: typeof Item.Type) => {
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

type ProcedureFormProps = {
  procedure: typeof Item.Type;
  validateForm?: (value: typeof Item.Type) => string | undefined;
  onSubmit: (values: typeof itemTable.$inferSelect) => Promise<void>;
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

export default function ProcedureForm({
  procedure,
  validateForm,
  onSubmit,
  children,
}: ProcedureFormProps) {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  const caseNumberRef = useRef<TextFieldRef>(null);
  const departmentOtherRef = useRef<TextFieldRef>(null);
  const specialFeaturesTextRef = useRef<TextFieldRef>(null);
  const regionalAnesthesiaTextRef = useRef<TextFieldRef>(null);
  const procedureRef = useRef<TextFieldRef>(null);

  const form = useForm({
    defaultValues: procedure,
    validators: {
      onBlur: ({ value }) => (validateForm ? validateForm(value) : validateFormInternally(value)),
      onMount: ({ value }) => (validateForm ? validateForm(value) : validateFormInternally(value)),
      onChange: ({ value }) => (validateForm ? validateForm(value) : validateFormInternally(value)),
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

      await onSubmit(itemValues);

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

  const dismiss = useCallback(async () => {
    await caseNumberRef.current?.blur();
    await departmentOtherRef.current?.blur();
    await specialFeaturesTextRef.current?.blur();
    await regionalAnesthesiaTextRef.current?.blur();
    await procedureRef.current?.blur();
    router.back();
  }, []);
  const save = useCallback(() => form.handleSubmit(), [form]);

  return (
    <>
      {children
        ? children({
            canSubmit: canSubmit && !isSubmitting,
            dismiss,
            save,
          })
        : null}
      <View className="flex-1 bg-black">
        <Host style={{ flex: 1 }}>
          <Form modifiers={[scrollContentBackground('hidden'), tint('#3B82F6')]}>
            <>
              <Section
                title={intl.formatMessage({ id: 'add-item.basic-info' })}
                modifiers={[listRowBackground('#1C1C1E')]}>
                <form.Field name="caseNumber">
                  {({ state, handleChange }) => (
                    <TextField
                      autocorrection={false}
                      onChangeText={(text) => handleChange(text)}
                      defaultValue={state.value}
                      placeholder={intl.formatMessage({ id: 'add-item.case-number' })}
                      ref={caseNumberRef}
                      keyboardType="numeric"
                    />
                  )}
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
