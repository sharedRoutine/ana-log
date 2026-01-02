import { View } from 'react-native';
import {
  Button,
  Form,
  Host,
  Picker,
  DateTimePicker,
  Switch,
  Section,
  TextFieldRef,
  Stepper,
  Text,
} from '@expo/ui/swift-ui';
import { useIntl } from 'react-intl';
import { useCallback, useRef } from 'react';
import { itemTable } from '~/db/schema';
import { useForm, useStore } from '@tanstack/react-form';
import { DateTime } from 'effect';
import { useColorScheme } from 'nativewind';

import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from '~/lib/options';
import { scrollContentBackground, tint } from '@expo/ui/swift-ui/modifiers';
import { Item } from '~/lib/schema';
import { DismissableTextField } from './DismissableTextField';

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
  isEditing?: boolean;
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

export default function ProcedureForm({
  procedure,
  validateForm,
  onSubmit,
  isEditing,
  onDelete,
  children,
}: ProcedureFormProps) {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  const caseNumberRef = useRef<TextFieldRef>(null);
  const departmentOtherRef = useRef<TextFieldRef>(null);
  const specialFeaturesTextRef = useRef<TextFieldRef>(null);
  const localAnestheticsTextRef = useRef<TextFieldRef>(null);
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
      await localAnestheticsTextRef.current?.blur();
      await procedureRef.current?.blur();

      const itemValues = {
        caseNumber: value.caseNumber,
        ageYears: value.patientAgeYears,
        ageMonths: value.patientAgeMonths,
        date: value.operationDate.epochMillis,
        asaScore: value.asaScore,
        airwayManagement: value.airwayManagement,
        department: value.department,
        departmentOther: value.department === 'other' ? value.departmentOther : null,
        specials: value.specialFeatures ? value.specialFeaturesText : null,
        localAnesthetics: value.localAnesthetics,
        localAnestheticsText: value.localAnesthetics ? value.localAnestheticsText : null,
        outpatient: value.outpatient,
        procedure: value.procedure,
      };

      await onSubmit(itemValues);

      form.reset();
    },
  });

  const departmentValue = useStore(form.store, (state) => state.values.department);
  const specialFeaturesValue = useStore(form.store, (state) => state.values.specialFeatures);
  const localAnestheticsValue = useStore(form.store, (state) => state.values.localAnesthetics);

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
    await localAnestheticsTextRef.current?.blur();
    await procedureRef.current?.blur();
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
      <View className="flex-1 bg-white dark:bg-black">
        <Host style={{ flex: 1 }}>
          <Form modifiers={[scrollContentBackground('hidden'), tint('#3B82F6')]}>
            <>
              <Section title={intl.formatMessage({ id: 'procedure.form.section.basic-info' })}>
                <form.Field name="caseNumber">
                  {({ state, handleChange }) => (
                    <DismissableTextField
                      autocorrection={false}
                      onChangeText={(text) => handleChange(text)}
                      defaultValue={state.value}
                      placeholder={intl.formatMessage({ id: 'procedure.form.case-number' })}
                      ref={caseNumberRef}
                      keyboardType="numeric"
                    />
                  )}
                </form.Field>
              </Section>
              <Section title={intl.formatMessage({ id: 'procedure.form.section.data' })}>
                <form.Field name="operationDate">
                  {({ state, handleChange }) => (
                    <DateTimePicker
                      onDateSelected={(date) => {
                        handleChange(DateTime.unsafeMake(date));
                      }}
                      key={state.value.epochMillis}
                      color={colorScheme === 'dark' ? 'white' : 'black'}
                      title={intl.formatMessage({ id: 'procedure.form.operation-date' })}
                      displayedComponents="date"
                      initialDate={DateTime.toDate(state.value).toISOString()}
                      variant="compact"
                    />
                  )}
                </form.Field>
                <form.Field name="patientAgeYears">
                  {({ state, handleChange }) => (
                    <Stepper
                      label={intl.formatMessage(
                        { id: 'procedure.form.age-in-years' },
                        { years: state.value }
                      )}
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
                      label={intl.formatMessage(
                        { id: 'procedure.form.age-in-months' },
                        { months: state.value }
                      )}
                      max={11}
                      min={0}
                      step={1}
                      defaultValue={state.value}
                      onValueChanged={(value) => handleChange(value)}
                    />
                  )}
                </form.Field>
              </Section>
              <Section title={intl.formatMessage({ id: 'procedure.form.section.details' })}>
                <form.Field name="asaScore">
                  {({ state, handleChange }) => (
                    <Picker
                      label={intl.formatMessage({ id: 'procedure.form.asa-score' })}
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
                      label={intl.formatMessage({ id: 'procedure.form.airway-management' })}
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
                      label={intl.formatMessage({ id: 'procedure.form.department' })}
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
                        <DismissableTextField
                          placeholder={intl.formatMessage({
                            id: 'procedure.form.department.other.placeholder',
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
              <Section title={intl.formatMessage({ id: 'procedure.form.section.settings' })}>
                <form.Field name="specialFeatures">
                  {({ state, handleChange }) => (
                    <Switch
                      label={intl.formatMessage({ id: 'procedure.form.special-features' })}
                      value={state.value}
                      onValueChange={handleChange}
                    />
                  )}
                </form.Field>
                <form.Field name="specialFeaturesText">
                  {({ state, handleChange }) => (
                    <>
                      {specialFeaturesValue && (
                        <DismissableTextField
                          placeholder={intl.formatMessage({
                            id: 'procedure.form.special-features.placeholder',
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
                <form.Field name="localAnesthetics">
                  {({ state, handleChange }) => (
                    <Switch
                      label={intl.formatMessage({ id: 'procedure.form.local-anesthetics' })}
                      value={state.value}
                      onValueChange={handleChange}
                    />
                  )}
                </form.Field>
                <form.Field name="localAnestheticsText">
                  {({ state, handleChange }) => (
                    <>
                      {localAnestheticsValue && (
                        <DismissableTextField
                          placeholder={intl.formatMessage({
                            id: 'procedure.form.local-anesthetics.placeholder',
                          })}
                          defaultValue={state.value}
                          onChangeText={handleChange}
                          multiline
                          numberOfLines={3}
                          autocorrection={false}
                          allowNewlines={true}
                          ref={localAnestheticsTextRef}
                        />
                      )}
                    </>
                  )}
                </form.Field>
                <form.Field name="outpatient">
                  {({ state, handleChange }) => (
                    <Switch
                      label={intl.formatMessage({ id: 'procedure.form.outpatient' })}
                      value={state.value}
                      onValueChange={handleChange}
                    />
                  )}
                </form.Field>
              </Section>
              <Section title={intl.formatMessage({ id: 'procedure.form.procedure' })}>
                <form.Field name="procedure">
                  {({ state, handleChange }) => (
                    <DismissableTextField
                      placeholder={intl.formatMessage({
                        id: 'procedure.form.procedure.placeholder',
                      })}
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
            {isEditing && (
              <Section>
                <Button role="destructive" onPress={onDelete}>
                  <Text>{intl.formatMessage({ id: 'edit-item.delete' })}</Text>
                </Button>
              </Section>
            )}
          </Form>
        </Host>
      </View>
    </>
  );
}
